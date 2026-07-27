import { useEffect, useRef, useState } from "react";
import { logWarn } from "../services/logger-service";

/**
 * Polls `fetcher` on an interval and folds each result into the state.
 * Skips ticks while the document is hidden and stops entirely after the
 * first failure (logged once), leaving the last known state in place.
 *
 * `fold` receives the previous state, so callers that only care about the
 * latest value can ignore it, while callers keeping a rolling history
 * (CPU, RAM, Clipboard) can append to it.
 *
 * `initialState` is read once on mount; later changes are ignored.
 * `fetcher` must be referentially stable (e.g. a module-level function).
 */
export function usePolling<TFetched, TState>(
  fetcher: () => Promise<TFetched>,
  intervalMs: number,
  label: string,
  fold: (previous: TState, next: TFetched) => TState,
  initialState: TState,
): TState {
  const [state, setState] = useState<TState>(initialState);

  // `fold` is usually written inline at the call site, so it is not
  // referentially stable — keep it in a ref instead of an effect dependency,
  // otherwise the poll loop would restart on every render.
  const foldRef = useRef(fold);
  useEffect(() => {
    foldRef.current = fold;
  });

  useEffect(() => {
    let active = true;

    const tick = () => {
      if (document.hidden) return;
      fetcher()
        .then((next) => {
          if (active) setState((previous) => foldRef.current(previous, next));
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

  return state;
}
