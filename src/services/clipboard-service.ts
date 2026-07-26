import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";

export function getClipboardText(): Promise<string> {
  return readText().then((text) => text ?? "");
}

export function setClipboardText(text: string): Promise<void> {
  return writeText(text);
}
