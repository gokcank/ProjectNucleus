use serde::Serialize;
use zbus::{proxy, Connection};

/// Never drive the screen fully dark from here. GNOME's own slider keeps a
/// floor for the same reason: a black screen leaves no way to see the control
/// you would need to undo it.
const MIN_PERCENT: i32 = 5;

/// GNOME's power daemon owns the backlight, so brightness goes through it
/// rather than through `/sys/class/backlight`, which needs root (or a udev
/// rule) to write to. This is the same interface GNOME's own quick settings
/// slider uses.
#[proxy(
    interface = "org.gnome.SettingsDaemon.Power.Screen",
    default_service = "org.gnome.SettingsDaemon.Power",
    default_path = "/org/gnome/SettingsDaemon/Power"
)]
trait Screen {
    #[zbus(property)]
    fn brightness(&self) -> zbus::Result<i32>;

    #[zbus(property)]
    fn set_brightness(&self, percent: i32) -> zbus::Result<()>;
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BrightnessStatus {
    /// False when there is no controllable backlight -- a desktop on external
    /// monitors, typically. The UI reports this as unsupported, not as an
    /// error, the way the Bluetooth card treats a missing adapter.
    supported: bool,
    percent: u8,
}

const UNSUPPORTED: BrightnessStatus = BrightnessStatus {
    supported: false,
    percent: 0,
};

async fn screen_proxy() -> Result<ScreenProxy<'static>, String> {
    let connection = Connection::session()
        .await
        .map_err(|err| format!("Session bus unavailable: {err}"))?;
    ScreenProxy::new(&connection)
        .await
        .map_err(|err| format!("Power settings unavailable: {err}"))
}

/// The daemon reports -1 when it has no backlight to control.
fn to_status(raw: i32) -> BrightnessStatus {
    if raw < 0 {
        return UNSUPPORTED;
    }
    BrightnessStatus {
        supported: true,
        percent: raw.clamp(0, 100) as u8,
    }
}

#[tauri::command]
pub async fn brightness_status() -> Result<BrightnessStatus, String> {
    // A missing daemon is "no brightness control here", not a failure worth
    // showing the user an error over.
    let Ok(proxy) = screen_proxy().await else {
        return Ok(UNSUPPORTED);
    };
    match proxy.brightness().await {
        Ok(raw) => Ok(to_status(raw)),
        Err(_) => Ok(UNSUPPORTED),
    }
}

#[tauri::command]
pub async fn set_brightness(percent: u8) -> Result<BrightnessStatus, String> {
    let proxy = screen_proxy().await?;
    let target = i32::from(percent).clamp(MIN_PERCENT, 100);

    proxy
        .set_brightness(target)
        .await
        .map_err(|err| format!("Could not change the brightness: {err}"))?;

    // Read back rather than assuming: the daemon rounds to whatever steps the
    // hardware actually supports, so the value it took may not be the one sent.
    match proxy.brightness().await {
        Ok(raw) => Ok(to_status(raw)),
        Err(_) => Ok(to_status(target)),
    }
}
