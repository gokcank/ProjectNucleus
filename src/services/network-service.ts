import { invoke } from "@tauri-apps/api/core";

export interface NetworkStatus {
  connected: boolean;
  /** "wifi", "ethernet", "other" or "none". */
  connectionType: string;
  /** Only set for Wi-Fi, and only when the access point reports a readable name. */
  ssid: string | null;
  localIp: string | null;
}

export function getNetworkStatus(): Promise<NetworkStatus> {
  return invoke<NetworkStatus>("network_status");
}

export interface NetworkSpeedStatus {
  /** False while there is no active connection to measure. */
  available: boolean;
  downMbps: number;
  upMbps: number;
}

/** Throughput since the last call, not point-in-time state -- meant to be polled. */
export function getNetworkSpeed(): Promise<NetworkSpeedStatus> {
  return invoke<NetworkSpeedStatus>("network_speed");
}

/**
 * Asks an outside service for the address this machine presents to the
 * internet. Unlike the rest of the network status this leaves the machine, so
 * it is only ever fetched on demand — never polled.
 */
export function getPublicIp(): Promise<string> {
  return invoke<string>("public_ip");
}
