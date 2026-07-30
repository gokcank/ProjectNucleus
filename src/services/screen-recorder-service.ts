import { invoke } from "@tauri-apps/api/core";
import { revealItemInDir } from "@tauri-apps/plugin-opener";

export interface RecorderStatus {
  /** False where the desktop has no screen recorder of its own. */
  supported: boolean;
  recording: boolean;
  /** Absolute path of the recording, once one has been started. */
  lastFile: string | null;
}

export function getRecorderStatus(): Promise<RecorderStatus> {
  return invoke<RecorderStatus>("recorder_status");
}

/** Each mutation returns the resulting state, so callers never have to re-read. */
export function startRecording(): Promise<RecorderStatus> {
  return invoke<RecorderStatus>("start_recording");
}

export function stopRecording(): Promise<RecorderStatus> {
  return invoke<RecorderStatus>("stop_recording");
}

export function revealRecording(path: string): Promise<void> {
  return revealItemInDir(path);
}
