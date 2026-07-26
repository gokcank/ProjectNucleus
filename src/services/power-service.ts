import { invoke } from "@tauri-apps/api/core";

export type PowerAction = "suspend" | "reboot" | "powerOff";

export interface PowerCapabilities {
  canSuspend: boolean;
  canReboot: boolean;
  canPowerOff: boolean;
}

export interface PowerProfileStatus {
  /** False when power-profiles-daemon is not running. */
  supported: boolean;
  active: string;
  available: string[];
}

export function getPowerCapabilities(): Promise<PowerCapabilities> {
  return invoke<PowerCapabilities>("power_capabilities");
}

export function runPowerAction(action: PowerAction): Promise<void> {
  return invoke<void>("run_power_action", { action });
}

export function getPowerProfileStatus(): Promise<PowerProfileStatus> {
  return invoke<PowerProfileStatus>("power_profile_status");
}

export function setPowerProfile(profile: string): Promise<PowerProfileStatus> {
  return invoke<PowerProfileStatus>("set_power_profile", { profile });
}
