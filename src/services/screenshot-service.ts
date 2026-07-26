import { invoke } from "@tauri-apps/api/core";
import { revealItemInDir } from "@tauri-apps/plugin-opener";

export interface SavedScreenshot {
  path: string;
  fileName: string;
}

/**
 * Hands off to the desktop's own screenshot portal and saves the result to the
 * user's Pictures directory. Resolves to `null` when the user dismisses the
 * portal dialog, which is a normal outcome rather than a failure.
 */
export function takeScreenshot(fileStem: string): Promise<SavedScreenshot | null> {
  return invoke<SavedScreenshot | null>("take_screenshot", { fileStem });
}

export function revealScreenshot(path: string): Promise<void> {
  return revealItemInDir(path);
}
