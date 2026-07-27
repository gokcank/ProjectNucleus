import { invoke } from "@tauri-apps/api/core";

export interface PickedColor {
  hex: string;
  r: number;
  g: number;
  b: number;
}

/**
 * Hands off to the desktop's own color-picker portal. Resolves to `null` when
 * the user dismisses the portal dialog, which is a normal outcome rather than
 * a failure.
 */
export function pickColor(): Promise<PickedColor | null> {
  return invoke<PickedColor | null>("pick_color");
}
