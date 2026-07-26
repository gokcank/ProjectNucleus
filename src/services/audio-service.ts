import { invoke } from "@tauri-apps/api/core";

export interface VolumeStatus {
  percent: number;
  muted: boolean;
}

export function getVolumeStatus(): Promise<VolumeStatus> {
  return invoke<VolumeStatus>("volume_status");
}

/** Each mutation returns the resulting state, so callers never have to re-read. */
export function setVolume(percent: number): Promise<VolumeStatus> {
  return invoke<VolumeStatus>("set_volume", { percent });
}

export function toggleMute(): Promise<VolumeStatus> {
  return invoke<VolumeStatus>("toggle_mute");
}
