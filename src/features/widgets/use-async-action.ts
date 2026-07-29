import { useState } from "react";
import { logWarn } from "../../services/logger-service";

interface ActionFailure {
  /** Prefix for the logged diagnostic, e.g. "Color pick failed:". */
  logPrefix: string;
  /** What the card shows the user, e.g. "Couldn't pick a color." */
  message: string;
}

/**
 * State for a widget action that runs on demand, can fail, and is worth
 * retrying — a desktop portal handing back a screenshot or a color, or a
 * lookup that goes out to the network. They share the same shape: a busy flag
 * while it runs, a result that survives until a newer one replaces it, and an
 * error that does not erase the last good result.
 *
 * The action resolves to `null` for a non-result that is not a failure either:
 * the user dismissing a portal dialog, say. That leaves every piece of state
 * as it was.
 */
export function useAsyncAction<T>() {
  const [result, setResult] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (
    action: () => Promise<T | null>,
    failure: ActionFailure,
    onSuccess?: (value: T) => void,
  ) => {
    setBusy(true);
    setError(null);
    action()
      .then((value) => {
        if (!value) return;
        setResult(value);
        onSuccess?.(value);
      })
      .catch((err: unknown) => {
        logWarn(`${failure.logPrefix} ${String(err)}`);
        setError(failure.message);
      })
      .finally(() => setBusy(false));
  };

  return { result, busy, error, run };
}
