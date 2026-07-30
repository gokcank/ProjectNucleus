import { invoke } from "@tauri-apps/api/core";

export interface BrightnessStatus {
  /** False when the machine has no controllable backlight. */
  supported: boolean;
  percent: number;
}

export function getBrightnessStatus(): Promise<BrightnessStatus> {
  return invoke<BrightnessStatus>("brightness_status");
}

/** Returns the resulting state, so callers never have to re-read. */
export function setBrightness(percent: number): Promise<BrightnessStatus> {
  return invoke<BrightnessStatus>("set_brightness", { percent });
}
