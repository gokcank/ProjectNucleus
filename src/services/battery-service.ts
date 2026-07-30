import { invoke } from "@tauri-apps/api/core";

export type BatteryState = "charging" | "discharging" | "full" | "empty" | "unknown";

export type PeripheralKind =
  | "mouse"
  | "keyboard"
  | "phone"
  | "tablet"
  | "gaming-input"
  | "headset"
  | "speakers"
  | "headphones"
  | "other";

/** A battery in something attached to the machine, not in the machine itself. */
export interface PeripheralBattery {
  name: string;
  kind: PeripheralKind;
  percent: number;
  state: BatteryState;
}

export interface BatteryStatus {
  /** False on a machine with no battery of its own, such as a desktop. */
  present: boolean;
  percent: number;
  state: BatteryState;
  /** Until empty while discharging, until full while charging; null when unknown. */
  secondsRemaining: number | null;
  peripherals: PeripheralBattery[];
}

export function getBatteryStatus(): Promise<BatteryStatus> {
  return invoke<BatteryStatus>("battery_status");
}
