import { invoke } from "@tauri-apps/api/core";

export interface HardwareInfo {
  /** Vendor and board or laptop model, e.g. "Gigabyte B660M DS3H DDR4". */
  model: string | null;
  cpu: string | null;
  /** Logical processors — threads, matching what GNOME's About panel counts. */
  cpuThreads: number;
  /** One entry per display chip; machines with an integrated and a discrete one report both. */
  graphics: string[];
  memoryBytes: number;
  operatingSystem: string | null;
  kernel: string | null;
  hostName: string | null;
}

export function getHardwareInfo(): Promise<HardwareInfo> {
  return invoke<HardwareInfo>("hardware_info");
}
