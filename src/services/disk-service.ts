import { invoke } from "@tauri-apps/api/core";

export interface Volume {
  /** Short name for a narrow card: "System", or the drive's own label. */
  name: string;
  /** Full mount path, for the tooltip. */
  mountPoint: string;
  /** The volume the machine runs from — listed first and emphasised. */
  isSystem: boolean;
  totalBytes: number;
  availableBytes: number;
}

export function getDiskStatus(): Promise<Volume[]> {
  return invoke<Volume[]>("disk_status");
}
