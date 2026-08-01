import { invoke } from "@tauri-apps/api/core";

export interface TemperatureReading {
  /** Short name that fits a narrow card: "CPU", "GPU", "Samsung". */
  label: string;
  /** Full model name, when the kernel knows one. */
  detail: string | null;
  celsius: number;
}

export interface SensorStatus {
  cpu: TemperatureReading | null;
  gpu: TemperatureReading | null;
  drives: TemperatureReading[];
}

export function getSensorStatus(): Promise<SensorStatus> {
  return invoke<SensorStatus>("sensor_status");
}
