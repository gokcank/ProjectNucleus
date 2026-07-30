use std::collections::HashMap;

use serde::Serialize;
use zbus::zvariant::{ObjectPath, OwnedObjectPath, OwnedValue};
use zbus::{proxy, Connection};

/// NM_DEVICE_TYPE_WIFI.
const DEVICE_TYPE_WIFI: u32 = 2;
/// NetworkManager's own name for the wireless section of a saved connection.
const WIRELESS_SETTING: &str = "802-11-wireless";
/// Passed to ActivateConnection when there is no particular access point to
/// insist on -- NetworkManager picks the best match itself.
const NO_SPECIFIC_OBJECT: &str = "/";

#[proxy(
    interface = "org.freedesktop.NetworkManager",
    default_service = "org.freedesktop.NetworkManager",
    default_path = "/org/freedesktop/NetworkManager"
)]
trait NetworkManager {
    fn get_devices(&self) -> zbus::Result<Vec<OwnedObjectPath>>;

    fn activate_connection(
        &self,
        connection: &ObjectPath<'_>,
        device: &ObjectPath<'_>,
        specific_object: &ObjectPath<'_>,
    ) -> zbus::Result<OwnedObjectPath>;

    #[zbus(property)]
    fn wireless_enabled(&self) -> zbus::Result<bool>;

    #[zbus(property)]
    fn set_wireless_enabled(&self, enabled: bool) -> zbus::Result<()>;
}

#[proxy(
    interface = "org.freedesktop.NetworkManager.Device",
    default_service = "org.freedesktop.NetworkManager"
)]
trait Device {
    #[zbus(property)]
    fn device_type(&self) -> zbus::Result<u32>;
}

#[proxy(
    interface = "org.freedesktop.NetworkManager.Device.Wireless",
    default_service = "org.freedesktop.NetworkManager"
)]
trait WirelessDevice {
    fn get_all_access_points(&self) -> zbus::Result<Vec<OwnedObjectPath>>;

    #[zbus(property)]
    fn active_access_point(&self) -> zbus::Result<OwnedObjectPath>;
}

#[proxy(
    interface = "org.freedesktop.NetworkManager.AccessPoint",
    default_service = "org.freedesktop.NetworkManager"
)]
trait AccessPoint {
    /// Raw bytes: an SSID is not required to be valid UTF-8.
    #[zbus(property)]
    fn ssid(&self) -> zbus::Result<Vec<u8>>;

    /// 0-100.
    #[zbus(property)]
    fn strength(&self) -> zbus::Result<u8>;
}

#[proxy(
    interface = "org.freedesktop.NetworkManager.Settings",
    default_service = "org.freedesktop.NetworkManager",
    default_path = "/org/freedesktop/NetworkManager/Settings"
)]
trait Settings {
    fn list_connections(&self) -> zbus::Result<Vec<OwnedObjectPath>>;
}

#[proxy(
    interface = "org.freedesktop.NetworkManager.Settings.Connection",
    default_service = "org.freedesktop.NetworkManager"
)]
trait SettingsConnection {
    fn get_settings(&self) -> zbus::Result<HashMap<String, HashMap<String, OwnedValue>>>;
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WifiNetwork {
    ssid: String,
    /// Signal strength, 0-100.
    strength: u8,
    /// Whether this is the network currently in use.
    active: bool,
    /// Whether NetworkManager already holds credentials for it. Only these
    /// can be joined from here -- entering a password is out of scope.
    saved: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WifiStatus {
    /// False when the machine has no wireless device at all. The UI reports
    /// this as a state rather than an error, the way the Bluetooth card
    /// treats a missing adapter.
    supported: bool,
    enabled: bool,
    networks: Vec<WifiNetwork>,
}

const UNSUPPORTED: WifiStatus = WifiStatus {
    supported: false,
    enabled: false,
    networks: Vec::new(),
};

async fn find_wifi_device(
    connection: &Connection,
    manager: &NetworkManagerProxy<'_>,
) -> Option<OwnedObjectPath> {
    for path in manager.get_devices().await.ok()? {
        let Ok(builder) = DeviceProxy::builder(connection).path(&path) else {
            continue;
        };
        let Ok(device) = builder.build().await else {
            continue;
        };
        if device.device_type().await.unwrap_or(0) == DEVICE_TYPE_WIFI {
            return Some(path);
        }
    }
    None
}

/// SSIDs NetworkManager already has a saved connection for.
async fn saved_ssids(connection: &Connection) -> Vec<String> {
    let Ok(settings) = SettingsProxy::new(connection).await else {
        return Vec::new();
    };
    let Ok(paths) = settings.list_connections().await else {
        return Vec::new();
    };

    let mut ssids = Vec::new();
    for path in paths {
        let Ok(builder) = SettingsConnectionProxy::builder(connection).path(&path) else {
            continue;
        };
        let Ok(saved) = builder.build().await else {
            continue;
        };
        let Ok(sections) = saved.get_settings().await else {
            continue;
        };
        if let Some(ssid) = sections
            .get(WIRELESS_SETTING)
            .and_then(|wireless| wireless.get("ssid"))
            .and_then(|value| Vec::<u8>::try_from(value.clone()).ok())
        {
            ssids.push(String::from_utf8_lossy(&ssid).into_owned());
        }
    }
    ssids
}

async fn read_networks(connection: &Connection, device_path: &OwnedObjectPath) -> Vec<WifiNetwork> {
    let Ok(builder) = WirelessDeviceProxy::builder(connection).path(device_path) else {
        return Vec::new();
    };
    let Ok(wireless) = builder.build().await else {
        return Vec::new();
    };
    let Ok(access_points) = wireless.get_all_access_points().await else {
        return Vec::new();
    };
    let active = wireless.active_access_point().await.ok();
    let saved = saved_ssids(connection).await;

    // One network usually shows up as several access points (mesh, or 2.4 and
    // 5 GHz radios). Collapse them by name, keeping the strongest signal.
    let mut by_ssid: HashMap<String, WifiNetwork> = HashMap::new();

    for path in access_points {
        let Ok(builder) = AccessPointProxy::builder(connection).path(&path) else {
            continue;
        };
        let Ok(point) = builder.build().await else {
            continue;
        };
        let Ok(raw_ssid) = point.ssid().await else {
            continue;
        };

        let ssid = String::from_utf8_lossy(&raw_ssid).into_owned();
        // A hidden network broadcasts an empty name; there is nothing to show.
        if ssid.is_empty() {
            continue;
        }

        let strength = point.strength().await.unwrap_or(0);
        let is_active = active.as_ref().is_some_and(|current| *current == path);

        by_ssid
            .entry(ssid.clone())
            .and_modify(|existing| {
                existing.strength = existing.strength.max(strength);
                existing.active |= is_active;
            })
            .or_insert_with(|| WifiNetwork {
                saved: saved.contains(&ssid),
                ssid,
                strength,
                active: is_active,
            });
    }

    let mut networks: Vec<WifiNetwork> = by_ssid.into_values().collect();
    // Connected first, then strongest, so the useful rows are at the top.
    networks.sort_by(|a, b| {
        b.active
            .cmp(&a.active)
            .then(b.strength.cmp(&a.strength))
            .then(a.ssid.cmp(&b.ssid))
    });
    networks
}

async fn read_status(connection: &Connection) -> Result<WifiStatus, String> {
    let manager = NetworkManagerProxy::new(connection)
        .await
        .map_err(|err| format!("NetworkManager unavailable: {err}"))?;

    let Some(device_path) = find_wifi_device(connection, &manager).await else {
        return Ok(UNSUPPORTED);
    };

    let enabled = manager.wireless_enabled().await.unwrap_or(false);
    // With the radio off there is nothing to scan; NetworkManager reports an
    // empty list anyway, so skip the round trips.
    let networks = if enabled {
        read_networks(connection, &device_path).await
    } else {
        Vec::new()
    };

    Ok(WifiStatus {
        supported: true,
        enabled,
        networks,
    })
}

#[tauri::command]
pub async fn wifi_status() -> Result<WifiStatus, String> {
    // A missing daemon means "no Wi-Fi here", not a failure worth showing an
    // error over.
    let Ok(connection) = Connection::system().await else {
        return Ok(UNSUPPORTED);
    };
    read_status(&connection).await
}

#[tauri::command]
pub async fn set_wifi_enabled(enabled: bool) -> Result<WifiStatus, String> {
    let connection = Connection::system()
        .await
        .map_err(|err| format!("System bus unavailable: {err}"))?;
    let manager = NetworkManagerProxy::new(&connection)
        .await
        .map_err(|err| format!("NetworkManager unavailable: {err}"))?;

    manager
        .set_wireless_enabled(enabled)
        .await
        .map_err(|err| format!("Could not switch Wi-Fi: {err}"))?;

    read_status(&connection).await
}

/// Joins a network NetworkManager already has credentials for. Networks it
/// does not know are refused here rather than silently doing nothing --
/// entering a password is deliberately not part of this card.
#[tauri::command]
pub async fn connect_wifi(ssid: String) -> Result<WifiStatus, String> {
    let connection = Connection::system()
        .await
        .map_err(|err| format!("System bus unavailable: {err}"))?;
    let manager = NetworkManagerProxy::new(&connection)
        .await
        .map_err(|err| format!("NetworkManager unavailable: {err}"))?;

    let Some(device_path) = find_wifi_device(&connection, &manager).await else {
        return Err("No wireless device on this machine".to_owned());
    };

    let settings = SettingsProxy::new(&connection)
        .await
        .map_err(|err| format!("NetworkManager settings unavailable: {err}"))?;
    let paths = settings
        .list_connections()
        .await
        .map_err(|err| format!("Could not read saved networks: {err}"))?;

    for path in paths {
        let Ok(builder) = SettingsConnectionProxy::builder(&connection).path(&path) else {
            continue;
        };
        let Ok(saved) = builder.build().await else {
            continue;
        };
        let Ok(sections) = saved.get_settings().await else {
            continue;
        };

        let matches = sections
            .get(WIRELESS_SETTING)
            .and_then(|wireless| wireless.get("ssid"))
            .and_then(|value| Vec::<u8>::try_from(value.clone()).ok())
            .is_some_and(|raw| String::from_utf8_lossy(&raw) == ssid);

        if matches {
            let specific = ObjectPath::try_from(NO_SPECIFIC_OBJECT)
                .map_err(|err| format!("Invalid object path: {err}"))?;
            manager
                .activate_connection(&path, &device_path, &specific)
                .await
                .map_err(|err| format!("Could not join {ssid}: {err}"))?;
            return read_status(&connection).await;
        }
    }

    Err(format!("No saved network named {ssid}"))
}
