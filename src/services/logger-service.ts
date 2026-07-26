import { info, warn, error } from "@tauri-apps/plugin-log";

function withConsoleFallback(
  tauriLog: (message: string) => Promise<void>,
  consoleLog: (message: string) => void,
) {
  return (message: string) => {
    tauriLog(message).catch(() => {
      // No Tauri runtime available (e.g. browser preview) — fall back to console.
      consoleLog(message);
    });
  };
}

export const logInfo = withConsoleFallback(info, console.info);
export const logWarn = withConsoleFallback(warn, console.warn);
export const logError = withConsoleFallback(error, console.error);
