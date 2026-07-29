use ashpd::desktop::settings::{ColorScheme, Settings};
use futures_util::StreamExt;
use serde::Serialize;
use tauri::{AppHandle, Emitter};

/// Event the frontend listens for; payload is the same shape as `color_scheme`'s result.
const COLOR_SCHEME_CHANGED_EVENT: &str = "color-scheme-changed";

#[derive(Serialize, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub enum ColorSchemeStatus {
    Dark,
    Light,
    NoPreference,
}

impl From<ColorScheme> for ColorSchemeStatus {
    fn from(scheme: ColorScheme) -> Self {
        match scheme {
            ColorScheme::PreferDark => Self::Dark,
            ColorScheme::PreferLight => Self::Light,
            ColorScheme::NoPreference => Self::NoPreference,
        }
    }
}

/// The desktop's preferred color scheme, via the XDG Settings portal
/// (`org.freedesktop.portal.Settings`) rather than the WebView's own
/// `prefers-color-scheme` guess -- WebKitGTK does not reliably read GNOME's
/// actual setting, nor update it live when the user changes it while the app
/// is running. This is the same portal GTK4/libadwaita apps read internally.
#[tauri::command]
pub async fn color_scheme() -> Result<ColorSchemeStatus, String> {
    let settings = Settings::new()
        .await
        .map_err(|err| format!("Settings portal unavailable: {err}"))?;
    settings
        .color_scheme()
        .await
        .map(ColorSchemeStatus::from)
        .map_err(|err| format!("Could not read the color scheme: {err}"))
}

/// Runs for the app's lifetime, forwarding the portal's change signal to the
/// frontend as a Tauri event so "System" theme tracks a live change instead
/// of only picking it up on next launch.
pub fn watch_color_scheme(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let settings = match Settings::new().await {
            Ok(settings) => settings,
            Err(err) => {
                log::warn!("Settings portal unavailable, color scheme changes won't be tracked live: {err}");
                return;
            }
        };

        let mut changes = match settings.receive_color_scheme_changed().await {
            Ok(stream) => stream,
            Err(err) => {
                log::warn!("Could not watch for color scheme changes: {err}");
                return;
            }
        };

        while let Some(scheme) = changes.next().await {
            let status = ColorSchemeStatus::from(scheme);
            if let Err(err) = app.emit(COLOR_SCHEME_CHANGED_EVENT, status) {
                log::warn!("Could not notify the frontend of a color scheme change: {err}");
            }
        }
    });
}
