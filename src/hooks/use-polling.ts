import { useEffect, useState } from "react";
import { logWarn } from "../services/logger-service";

/**
 * Polls `fetcher` on an interval. Skips ticks while the document is hidden
 * and stops entirely after the first failure (logged once).
 * `fetcher` must be referentially stable (e.g. a module-level function).
 */
export function usePolling<T>(fetcher: () => Promise<T>, intervalMs: number, label: string) {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    let active = true;

    const tick = () => {
      if (document.hidden) return;
      fetcher()
        .then((next) => {
          if (active) setValue(next);
        })
        .catch((err: unknown) => {
          logWarn(`${label} unavailable, polling stopped: ${String(err)}`);
          window.clearInterval(intervalId);
        });
    };

    tick();
    const intervalId = window.setInterval(tick, intervalMs);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [fetcher, intervalMs, label]);

  return value;
}
