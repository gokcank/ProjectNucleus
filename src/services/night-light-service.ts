import { invoke } from "@tauri-apps/api/core";

export interface NightLightStatus {
  /** False when the GNOME colour schema is not installed. */
  supported: boolean;
  enabled: boolean;
  temperature: number;
}

export function getNightLightStatus(): Promise<NightLightStatus> {
  return invoke<NightLightStatus>("night_light_status");
}

export function setNightLightEnabled(enabled: boolean): Promise<NightLightStatus> {
  return invoke<NightLightStatus>("set_night_light_enabled", { enabled });
}

export function setNightLightTemperature(kelvin: number): Promise<NightLightStatus> {
  return invoke<NightLightStatus>("set_night_light_temperature", { kelvin });
}
