import { invoke } from "@tauri-apps/api/core";

export interface WifiNetwork {
  ssid: string;
  /** Signal strength, 0-100. */
  strength: number;
  active: boolean;
  /** Whether credentials are already saved; only these can be joined here. */
  saved: boolean;
}

export interface WifiStatus {
  /** False when the machine has no wireless device at all. */
  supported: boolean;
  enabled: boolean;
  networks: WifiNetwork[];
}

export function getWifiStatus(): Promise<WifiStatus> {
  return invoke<WifiStatus>("wifi_status");
}

/** Each mutation returns the resulting state, so callers never have to re-read. */
export function setWifiEnabled(enabled: boolean): Promise<WifiStatus> {
  return invoke<WifiStatus>("set_wifi_enabled", { enabled });
}

export function connectWifi(ssid: string): Promise<WifiStatus> {
  return invoke<WifiStatus>("connect_wifi", { ssid });
}
