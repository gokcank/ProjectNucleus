import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";

/**
 * Resolves to "" when the clipboard is empty or holds non-text content, instead of rejecting.
 * The underlying plugin treats "nothing to read" as an error, but that is a normal, common
 * clipboard state here (e.g. right after app startup) rather than a real failure.
 */
export function getClipboardText(): Promise<string> {
  return readText()
    .then((text) => text ?? "")
    .catch(() => "");
}

export function setClipboardText(text: string): Promise<void> {
  return writeText(text);
}
