import { invoke } from "@tauri-apps/api/core";

export interface CpuStatus {
  usagePercent: number;
}

export interface MemoryStatus {
  usedBytes: number;
  totalBytes: number;
}

export function getCpuStatus(): Promise<CpuStatus> {
  return invoke<CpuStatus>("cpu_status");
}

export function getMemoryStatus(): Promise<MemoryStatus> {
  return invoke<MemoryStatus>("memory_status");
}
