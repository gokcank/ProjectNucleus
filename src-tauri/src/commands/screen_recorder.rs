use serde::Serialize;
use std::collections::HashMap;
use std::sync::Mutex;
use zbus::zvariant::Value;
use zbus::{proxy, Connection};

/// Where recordings land, relative to the user's Videos folder. GNOME expands
/// `%d` to the date and `%t` to the time, which is how its own Ctrl+Alt+Shift+R
/// recordings are named -- so ours sit alongside them rather than inventing a
/// separate convention.
const FILE_TEMPLATE: &str = "Nucleus-%d%t";

/// GNOME Shell records the screen itself, encodes it, and writes the file. Going
/// through it rather than the generic ScreenCast portal avoids having to drive a
/// PipeWire stream and bundle an encoder for something the desktop already does
/// -- the same reasoning as reading brightness from GNOME's power daemon.
#[proxy(
    interface = "org.gnome.Shell.Screencast",
    default_service = "org.gnome.Shell.Screencast",
    default_path = "/org/gnome/Shell/Screencast"
)]
trait Screencast {
    fn screencast(
        &self,
        file_template: &str,
        options: HashMap<&str, Value<'_>>,
    ) -> zbus::Result<(bool, String)>;

    fn stop_screencast(&self) -> zbus::Result<bool>;

    #[zbus(property)]
    fn screencast_supported(&self) -> zbus::Result<bool>;
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecorderStatus {
    /// False where the desktop has no screen recorder of its own -- another
    /// desktop environment, typically. Reported as a state, not an error.
    supported: bool,
    recording: bool,
    /// Absolute path of the finished recording, once there is one.
    last_file: Option<String>,
}

/// Holds the D-Bus connection open for as long as the app runs.
///
/// GNOME ties a recording to the connection that asked for it, and aborts with
/// "Sender has vanished" the moment that connection closes. Opening a fresh one
/// per command -- the obvious thing, and what every other card here does --
/// therefore killed the recording the instant `start_recording` returned.
#[derive(Default)]
pub struct RecorderConnection {
    // Only ever locked to read or replace the handle, never across an await.
    session: Mutex<Option<Connection>>,
}

async fn screencast_proxy(state: &RecorderConnection) -> Result<ScreencastProxy<'static>, String> {
    let existing = state
        .session
        .lock()
        .expect("recorder connection lock poisoned")
        .clone();

    let connection = match existing {
        Some(connection) => connection,
        None => {
            let connection = Connection::session()
                .await
                .map_err(|err| format!("Session bus unavailable: {err}"))?;
            *state
                .session
                .lock()
                .expect("recorder connection lock poisoned") = Some(connection.clone());
            connection
        }
    };

    ScreencastProxy::new(&connection)
        .await
        .map_err(|err| format!("Screen recorder unavailable: {err}"))
}

#[tauri::command]
pub async fn recorder_status(
    state: tauri::State<'_, RecorderConnection>,
) -> Result<RecorderStatus, String> {
    // A missing service means "no recorder on this desktop", not a failure
    // worth showing an error over.
    let Ok(proxy) = screencast_proxy(&state).await else {
        return Ok(RecorderStatus {
            supported: false,
            recording: false,
            last_file: None,
        });
    };

    Ok(RecorderStatus {
        supported: proxy.screencast_supported().await.unwrap_or(false),
        // GNOME does not expose whether a recording is in progress, so the
        // frontend owns that: it knows what it started.
        recording: false,
        last_file: None,
    })
}

#[tauri::command]
pub async fn start_recording(
    state: tauri::State<'_, RecorderConnection>,
) -> Result<RecorderStatus, String> {
    let proxy = screencast_proxy(&state).await?;

    let mut options: HashMap<&str, Value<'_>> = HashMap::new();
    options.insert("draw-cursor", Value::Bool(true));

    let (success, filename) = proxy
        .screencast(FILE_TEMPLATE, options)
        .await
        .map_err(|err| format!("Could not start recording: {err}"))?;

    if !success {
        // GNOME refuses a second recording while one is already running, which
        // is the usual reason to land here.
        return Err("The desktop refused to start a recording".to_owned());
    }

    Ok(RecorderStatus {
        supported: true,
        recording: true,
        last_file: Some(filename),
    })
}

#[tauri::command]
pub async fn stop_recording(
    state: tauri::State<'_, RecorderConnection>,
) -> Result<RecorderStatus, String> {
    let proxy = screencast_proxy(&state).await?;

    proxy
        .stop_screencast()
        .await
        .map_err(|err| format!("Could not stop recording: {err}"))?;

    Ok(RecorderStatus {
        supported: true,
        recording: false,
        last_file: None,
    })
}
