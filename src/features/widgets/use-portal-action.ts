import { useState } from "react";
import { logWarn } from "../../services/logger-service";

interface PortalFailure {
  /** Prefix for the logged diagnostic, e.g. "Color pick failed:". */
  logPrefix: string;
  /** What the card shows the user, e.g. "Couldn't pick a color." */
  message: string;
}

/**
 * State for a widget that hands a job to an XDG desktop portal (Screenshot,
 * Color Picker). Those all share the same shape: a busy flag while the portal
 * dialog is up, a result that survives until a newer one replaces it, and an
 * error that does not erase the last good result.
 *
 * The action resolves to `null` when the user dismisses the portal dialog,
 * which is a normal outcome rather than a failure.
 */
export function usePortalAction<T>() {
  const [result, setResult] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (
    action: () => Promise<T | null>,
    failure: PortalFailure,
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
