import { invoke } from "@tauri-apps/api/core";

export interface BluetoothDevice {
  address: string;
  name: string;
  connected: boolean;
}

export interface BluetoothStatus {
  /** False when the machine has no Bluetooth adapter at all. */
  available: boolean;
  powered: boolean;
  devices: BluetoothDevice[];
}

export function getBluetoothStatus(): Promise<BluetoothStatus> {
  return invoke<BluetoothStatus>("bluetooth_status");
}

export function setBluetoothPowered(powered: boolean): Promise<BluetoothStatus> {
  return invoke<BluetoothStatus>("set_bluetooth_powered", { powered });
}

export function setDeviceConnected(address: string, connected: boolean): Promise<BluetoothStatus> {
  return invoke<BluetoothStatus>("set_device_connected", { address, connected });
}
