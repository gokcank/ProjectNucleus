use serde::Serialize;
use zbus::zvariant::OwnedObjectPath;
use zbus::{proxy, Connection};

#[proxy(
    interface = "org.freedesktop.UPower",
    default_service = "org.freedesktop.UPower",
    default_path = "/org/freedesktop/UPower"
)]
trait UPower {
    fn enumerate_devices(&self) -> zbus::Result<Vec<OwnedObjectPath>>;
}

/// Used both for UPower's composite device -- the machine's own battery,
/// already aggregated across cells -- and, per path, for each peripheral it
/// knows about.
#[proxy(
    interface = "org.freedesktop.UPower.Device",
    default_service = "org.freedesktop.UPower",
    default_path = "/org/freedesktop/UPower/devices/DisplayDevice"
)]
trait UPowerDevice {
    #[zbus(property)]
    fn is_present(&self) -> zbus::Result<bool>;

    #[zbus(property)]
    fn percentage(&self) -> zbus::Result<f64>;

    #[zbus(property)]
    fn state(&self) -> zbus::Result<u32>;

    #[zbus(property)]
    fn time_to_empty(&self) -> zbus::Result<i64>;

    #[zbus(property)]
    fn time_to_full(&self) -> zbus::Result<i64>;

    /// True for whatever powers the machine itself, false for peripherals.
    #[zbus(property)]
    fn power_supply(&self) -> zbus::Result<bool>;

    #[zbus(property)]
    fn model(&self) -> zbus::Result<String>;

    #[zbus(property)]
    fn vendor(&self) -> zbus::Result<String>;

    /// Named explicitly because `type` is a Rust keyword.
    #[zbus(property, name = "Type")]
    fn device_type(&self) -> zbus::Result<u32>;
}

#[derive(Serialize, Clone, Copy, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum BatteryState {
    Charging,
    Discharging,
    Full,
    Empty,
    Unknown,
}

/// A battery in something attached to the machine rather than in the machine:
/// a wireless mouse, a headset, a phone.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PeripheralBattery {
    name: String,
    /// Broad category, so the UI can pick an icon without knowing UPower's
    /// numbering.
    kind: &'static str,
    percent: u8,
    state: BatteryState,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatteryStatus {
    /// False on a machine with no battery of its own -- a desktop, typically.
    /// The UI reports this as a state rather than an error, the way the
    /// Bluetooth card treats a missing adapter.
    present: bool,
    percent: u8,
    state: BatteryState,
    /// Seconds until empty while discharging, or until full while charging.
    /// `None` when the daemon can't estimate it yet, which is common right
    /// after plugging in or unplugging.
    seconds_remaining: Option<u64>,
    peripherals: Vec<PeripheralBattery>,
}

fn absent(peripherals: Vec<PeripheralBattery>) -> BatteryStatus {
    BatteryStatus {
        present: false,
        percent: 0,
        state: BatteryState::Unknown,
        seconds_remaining: None,
        peripherals,
    }
}

/// UPower's `State` enum. The two "pending" values mean plugged in but idle,
/// or unplugged but not yet drawing down; each is folded into its nearest
/// everyday meaning rather than given a label of its own.
fn to_state(raw: u32) -> BatteryState {
    match raw {
        1 | 5 => BatteryState::Charging,
        2 | 6 => BatteryState::Discharging,
        3 => BatteryState::Empty,
        4 => BatteryState::Full,
        _ => BatteryState::Unknown,
    }
}

/// UPower's `Type` enum, narrowed to the categories worth an icon of their
/// own. Anything else is still listed, just without a specific label.
fn to_kind(raw: u32) -> &'static str {
    match raw {
        5 => "mouse",
        6 => "keyboard",
        8 => "phone",
        10 => "tablet",
        12 => "gaming-input",
        17 => "headset",
        18 => "speakers",
        19 => "headphones",
        _ => "other",
    }
}

/// Prefers the model, since that is what someone recognizes ("PRO X 2"),
/// falling back to the vendor and then to the category.
fn device_name(model: String, vendor: String, kind: &str) -> String {
    for candidate in [model, vendor] {
        let trimmed = candidate.trim();
        if !trimmed.is_empty() {
            return trimmed.to_owned();
        }
    }
    kind.replace('-', " ")
}

/// Every battery UPower knows about that isn't powering the machine itself.
async fn read_peripherals(connection: &Connection) -> Vec<PeripheralBattery> {
    let Ok(upower) = UPowerProxy::new(connection).await else {
        return Vec::new();
    };
    let Ok(paths) = upower.enumerate_devices().await else {
        return Vec::new();
    };

    let mut peripherals = Vec::new();
    for path in paths {
        let Ok(builder) = UPowerDeviceProxy::builder(connection).path(&path) else {
            continue;
        };
        let Ok(device) = builder.build().await else {
            continue;
        };

        // Skip the machine's own supply and anything with no cell in it.
        if device.power_supply().await.unwrap_or(true) {
            continue;
        }
        if !device.is_present().await.unwrap_or(false) {
            continue;
        }

        let kind = to_kind(device.device_type().await.unwrap_or(0));
        peripherals.push(PeripheralBattery {
            name: device_name(
                device.model().await.unwrap_or_default(),
                device.vendor().await.unwrap_or_default(),
                kind,
            ),
            kind,
            percent: device.percentage().await.unwrap_or(0.0).clamp(0.0, 100.0) as u8,
            state: to_state(device.state().await.unwrap_or(0)),
        });
    }
    peripherals
}

#[tauri::command]
pub async fn battery_status() -> Result<BatteryStatus, String> {
    // A missing daemon means "no battery reading here", not a failure worth
    // showing an error over.
    let Ok(connection) = Connection::system().await else {
        return Ok(absent(Vec::new()));
    };

    let peripherals = read_peripherals(&connection).await;

    let Ok(device) = UPowerDeviceProxy::new(&connection).await else {
        return Ok(absent(peripherals));
    };

    if !device.is_present().await.unwrap_or(false) {
        return Ok(absent(peripherals));
    }

    let state = to_state(device.state().await.unwrap_or(0));
    let percent = device.percentage().await.unwrap_or(0.0).clamp(0.0, 100.0) as u8;

    // Only one of the two estimates is meaningful at a time, and either is
    // reported as 0 when the daemon has nothing to go on yet.
    let raw_remaining = match state {
        BatteryState::Charging => device.time_to_full().await.unwrap_or(0),
        BatteryState::Discharging => device.time_to_empty().await.unwrap_or(0),
        _ => 0,
    };

    Ok(BatteryStatus {
        present: true,
        percent,
        state,
        seconds_remaining: (raw_remaining > 0).then_some(raw_remaining as u64),
        peripherals,
    })
}
