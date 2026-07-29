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

/**
 * Asks an outside service for the address this machine presents to the
 * internet. Unlike the rest of the network status this leaves the machine, so
 * it is only ever fetched on demand — never polled.
 */
export function getPublicIp(): Promise<string> {
  return invoke<string>("public_ip");
}
