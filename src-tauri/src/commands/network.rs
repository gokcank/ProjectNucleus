use std::collections::HashMap;
use std::process::Command;

use serde::Serialize;
use zbus::zvariant::{OwnedObjectPath, OwnedValue};
use zbus::{proxy, Connection};

/// NetworkManager reports "/" for an object property that is unset, which is
/// how "nothing is connected" arrives rather than as an error.
const UNSET_PATH: &str = "/";

/// NetworkManager's own connection type strings.
const TYPE_WIFI: &str = "802-11-wireless";
const TYPE_ETHERNET: &str = "802-3-ethernet";

/// Where the public IP is fetched from. Plain-text body, no API key, no
/// redirects — the whole response is the address.
const PUBLIC_IP_URL: &str = "https://api.ipify.org";

/// Kept short so a captive portal or a dead link fails fast instead of
/// leaving the card spinning.
const PUBLIC_IP_TIMEOUT_SECS: &str = "3";

#[proxy(
    interface = "org.freedesktop.NetworkManager",
    default_service = "org.freedesktop.NetworkManager",
    default_path = "/org/freedesktop/NetworkManager"
)]
trait NetworkManager {
    #[zbus(property)]
    fn primary_connection(&self) -> zbus::Result<OwnedObjectPath>;
}

#[proxy(
    interface = "org.freedesktop.NetworkManager.Connection.Active",
    default_service = "org.freedesktop.NetworkManager"
)]
trait ActiveConnection {
    #[zbus(property)]
    fn type_(&self) -> zbus::Result<String>;

    #[zbus(property)]
    fn ip4_config(&self) -> zbus::Result<OwnedObjectPath>;

    #[zbus(property)]
    fn devices(&self) -> zbus::Result<Vec<OwnedObjectPath>>;
}

#[proxy(
    interface = "org.freedesktop.NetworkManager.IP4Config",
    default_service = "org.freedesktop.NetworkManager"
)]
trait Ip4Config {
    /// Each entry is a dict with at least "address" (string) and "prefix" (u32).
    #[zbus(property)]
    fn address_data(&self) -> zbus::Result<Vec<HashMap<String, OwnedValue>>>;
}

#[proxy(
    interface = "org.freedesktop.NetworkManager.Device.Wireless",
    default_service = "org.freedesktop.NetworkManager"
)]
trait WirelessDevice {
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
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkStatus {
    connected: bool,
    /// "wifi", "ethernet", "other" or "none" — the frontend picks an icon from this.
    connection_type: String,
    /// Only ever set for Wi-Fi, and only when the access point reports a
    /// readable name.
    ssid: Option<String>,
    local_ip: Option<String>,
}

impl NetworkStatus {
    fn disconnected() -> Self {
        Self {
            connected: false,
            connection_type: "none".to_owned(),
            ssid: None,
            local_ip: None,
        }
    }
}

async fn read_local_ip(
    connection: &Connection,
    active: &ActiveConnectionProxy<'_>,
) -> Option<String> {
    let config_path = active.ip4_config().await.ok()?;
    if config_path.as_str() == UNSET_PATH {
        return None;
    }

    let config = Ip4ConfigProxy::builder(connection)
        .path(config_path)
        .ok()?
        .build()
        .await
        .ok()?;

    let addresses = config.address_data().await.ok()?;
    addresses
        .first()?
        .get("address")
        .and_then(|value| String::try_from(value.clone()).ok())
}

async fn read_ssid(connection: &Connection, active: &ActiveConnectionProxy<'_>) -> Option<String> {
    // The connection's own Id is the saved profile's name, which the user can
    // rename; the access point is the only source for the real SSID.
    let device_path = active.devices().await.ok()?.into_iter().next()?;

    let device = WirelessDeviceProxy::builder(connection)
        .path(device_path)
        .ok()?
        .build()
        .await
        .ok()?;

    let ap_path = device.active_access_point().await.ok()?;
    if ap_path.as_str() == UNSET_PATH {
        return None;
    }

    let access_point = AccessPointProxy::builder(connection)
        .path(ap_path)
        .ok()?
        .build()
        .await
        .ok()?;

    let raw = access_point.ssid().await.ok()?;
    String::from_utf8(raw).ok()
}

#[tauri::command]
pub async fn network_status() -> Result<NetworkStatus, String> {
    let connection = Connection::system()
        .await
        .map_err(|err| format!("System bus unavailable: {err}"))?;

    let manager = NetworkManagerProxy::new(&connection)
        .await
        .map_err(|err| format!("NetworkManager unavailable: {err}"))?;

    let primary = manager
        .primary_connection()
        .await
        .map_err(|err| format!("Could not read network state: {err}"))?;

    if primary.as_str() == UNSET_PATH {
        return Ok(NetworkStatus::disconnected());
    }

    let active = ActiveConnectionProxy::builder(&connection)
        .path(primary)
        .map_err(|err| format!("Invalid connection path: {err}"))?
        .build()
        .await
        .map_err(|err| format!("Could not reach the active connection: {err}"))?;

    let raw_type = active.type_().await.unwrap_or_default();
    let connection_type = match raw_type.as_str() {
        TYPE_WIFI => "wifi",
        TYPE_ETHERNET => "ethernet",
        _ => "other",
    };

    let ssid = if connection_type == "wifi" {
        read_ssid(&connection, &active).await
    } else {
        None
    };

    Ok(NetworkStatus {
        connected: true,
        connection_type: connection_type.to_owned(),
        ssid,
        local_ip: read_local_ip(&connection, &active).await,
    })
}

/// Asks an outside service what our address looks like from the internet.
/// Every argument is fixed here — nothing from the frontend reaches the process.
#[tauri::command]
pub fn public_ip() -> Result<String, String> {
    let output = Command::new("curl")
        .args([
            "--silent",
            "--show-error",
            "--max-time",
            PUBLIC_IP_TIMEOUT_SECS,
            PUBLIC_IP_URL,
        ])
        .output()
        .map_err(|err| format!("curl unavailable: {err}"))?;

    if !output.status.success() {
        let detail = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "Could not reach the address service: {}",
            detail.trim()
        ));
    }

    let address = String::from_utf8(output.stdout)
        .map_err(|err| format!("Address service returned invalid output: {err}"))?
        .trim()
        .to_owned();

    if address.is_empty() {
        return Err("Address service returned nothing".to_owned());
    }

    Ok(address)
}
