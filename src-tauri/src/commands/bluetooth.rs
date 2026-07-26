use std::collections::HashMap;
use std::time::Duration;

use serde::Serialize;
use zbus::fdo::ObjectManagerProxy;
use zbus::names::OwnedInterfaceName;
use zbus::zvariant::{OwnedObjectPath, OwnedValue};
use zbus::{proxy, Connection};

const BLUEZ: &str = "org.bluez";
const ADAPTER_INTERFACE: &str = "org.bluez.Adapter1";
const DEVICE_INTERFACE: &str = "org.bluez.Device1";

#[proxy(interface = "org.bluez.Adapter1", default_service = "org.bluez")]
trait Adapter {
    #[zbus(property)]
    fn set_powered(&self, powered: bool) -> zbus::Result<()>;
}

#[proxy(interface = "org.bluez.Device1", default_service = "org.bluez")]
trait Device {
    fn connect(&self) -> zbus::Result<()>;
    fn disconnect(&self) -> zbus::Result<()>;
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BluetoothDevice {
    address: String,
    name: String,
    connected: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BluetoothStatus {
    /// False when the machine has no Bluetooth adapter at all, which the UI
    /// reports as "unsupported" rather than as an error.
    available: bool,
    powered: bool,
    devices: Vec<BluetoothDevice>,
}

type DeviceProperties = HashMap<String, OwnedValue>;
type ManagedObjects = HashMap<OwnedObjectPath, HashMap<OwnedInterfaceName, DeviceProperties>>;

fn read_bool(props: &DeviceProperties, key: &str) -> bool {
    props
        .get(key)
        .and_then(|value| bool::try_from(value.clone()).ok())
        .unwrap_or(false)
}

fn read_string(props: &DeviceProperties, key: &str) -> Option<String> {
    props
        .get(key)
        .and_then(|value| String::try_from(value.clone()).ok())
}

async fn managed_objects(connection: &Connection) -> Result<ManagedObjects, String> {
    let manager = ObjectManagerProxy::new(connection, BLUEZ, "/")
        .await
        .map_err(|err| format!("Bluetooth service unavailable: {err}"))?;

    manager
        .get_managed_objects()
        .await
        .map_err(|err| format!("Could not read Bluetooth state: {err}"))
}

/// Returns the first adapter's object path, or `None` when no adapter exists.
fn find_adapter(objects: &ManagedObjects) -> Option<OwnedObjectPath> {
    let mut paths: Vec<&OwnedObjectPath> = objects
        .iter()
        .filter(|(_, interfaces)| interfaces.contains_key(ADAPTER_INTERFACE))
        .map(|(path, _)| path)
        .collect();

    // Sorting keeps the choice stable across calls when several adapters exist.
    paths.sort_by(|a, b| a.as_str().cmp(b.as_str()));
    paths.first().map(|path| (*path).clone())
}

fn find_device_path(objects: &ManagedObjects, address: &str) -> Option<OwnedObjectPath> {
    objects.iter().find_map(|(path, interfaces)| {
        let props = interfaces.get(DEVICE_INTERFACE)?;
        (read_string(props, "Address")?.eq_ignore_ascii_case(address)).then(|| path.clone())
    })
}

fn collect_status(objects: &ManagedObjects) -> BluetoothStatus {
    let Some(adapter_path) = find_adapter(objects) else {
        return BluetoothStatus {
            available: false,
            powered: false,
            devices: Vec::new(),
        };
    };

    let powered = objects
        .get(&adapter_path)
        .and_then(|interfaces| interfaces.get(ADAPTER_INTERFACE))
        .map(|props| read_bool(props, "Powered"))
        .unwrap_or(false);

    // Only paired devices are listed. While the adapter is scanning, every
    // nearby device shows up here, which is noise rather than a control.
    let mut devices: Vec<BluetoothDevice> = objects
        .values()
        .filter_map(|interfaces| interfaces.get(DEVICE_INTERFACE))
        .filter(|props| read_bool(props, "Paired"))
        .filter_map(|props| {
            let address = read_string(props, "Address")?;
            let name = read_string(props, "Alias")
                .or_else(|| read_string(props, "Name"))
                .unwrap_or_else(|| address.clone());
            Some(BluetoothDevice {
                address,
                name,
                connected: read_bool(props, "Connected"),
            })
        })
        .collect();

    devices.sort_by(|a, b| {
        b.connected
            .cmp(&a.connected)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    BluetoothStatus {
        available: true,
        powered,
        devices,
    }
}

#[tauri::command]
pub async fn bluetooth_status() -> Result<BluetoothStatus, String> {
    let connection = Connection::system()
        .await
        .map_err(|err| format!("System bus unavailable: {err}"))?;

    Ok(collect_status(&managed_objects(&connection).await?))
}

#[tauri::command]
pub async fn set_bluetooth_powered(powered: bool) -> Result<BluetoothStatus, String> {
    let connection = Connection::system()
        .await
        .map_err(|err| format!("System bus unavailable: {err}"))?;

    let objects = managed_objects(&connection).await?;
    let adapter_path = find_adapter(&objects).ok_or("No Bluetooth adapter found")?;

    AdapterProxy::builder(&connection)
        .path(adapter_path)
        .map_err(|err| format!("Invalid adapter path: {err}"))?
        .build()
        .await
        .map_err(|err| format!("Could not reach the adapter: {err}"))?
        .set_powered(powered)
        .await
        .map_err(|err| format!("Could not change Bluetooth power: {err}"))?;

    Ok(collect_status(&managed_objects(&connection).await?))
}

/// A device that has gone to standby usually misses the first connection
/// attempt and answers the next one. Retrying once here means the user does not
/// have to notice the difference and press the button again.
const CONNECT_ATTEMPTS: u32 = 2;
const RETRY_DELAY: Duration = Duration::from_millis(1500);

/// Connecting can take several seconds while the device is woken up, so this
/// stays awaited rather than firing and returning a stale state.
#[tauri::command]
pub async fn set_device_connected(
    address: String,
    connected: bool,
) -> Result<BluetoothStatus, String> {
    let connection = Connection::system()
        .await
        .map_err(|err| format!("System bus unavailable: {err}"))?;

    let objects = managed_objects(&connection).await?;
    let device_path = find_device_path(&objects, &address).ok_or("Bluetooth device not found")?;

    let device = DeviceProxy::builder(&connection)
        .path(device_path)
        .map_err(|err| format!("Invalid device path: {err}"))?
        .build()
        .await
        .map_err(|err| format!("Could not reach the device: {err}"))?;

    if !connected {
        device
            .disconnect()
            .await
            .map_err(|err| format!("Could not disconnect device: {err}"))?;
        return Ok(collect_status(&managed_objects(&connection).await?));
    }

    let mut last_error = String::new();
    for attempt in 0..CONNECT_ATTEMPTS {
        match device.connect().await {
            Ok(()) => return Ok(collect_status(&managed_objects(&connection).await?)),
            Err(err) => last_error = err.to_string(),
        }
        if attempt + 1 < CONNECT_ATTEMPTS {
            tokio::time::sleep(RETRY_DELAY).await;
        }
    }

    Err(format!("Could not connect to device: {last_error}"))
}
