import { useEffect, useRef, useState } from "react";
import { logWarn } from "../../services/logger-service";
import { getSetting, setSetting } from "../../services/settings-service";

/** Ready-made `isValid` guard for the common case of a boolean setting. */
export const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

/**
 * Persisted, widget-scoped setting. Stored under `widget.<widgetId>.<key>`
 * so widgets cannot collide with each other or with application settings.
 * `isValid` guards against malformed stored values; invalid values fall
 * back to `fallback`.
 */
export function useWidgetSetting<T>(
  widgetId: string,
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
) {
  const [value, setValue] = useState<T>(fallback);
  const settingKey = `widget.${widgetId}.${key}`;

  // Guards against the load below overwriting a change the user already
  // made while it was in flight — without it, editing a list (Todo, Quick
  // Links) right after opening the panel could have the edit clobbered by
  // the stale value the load resolves with a moment later.
  const hasUpdatedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getSetting<unknown>(settingKey, fallback)
      .then((stored) => {
        if (!cancelled && !hasUpdatedRef.current && isValid(stored)) setValue(stored);
      })
      .catch((err: unknown) => {
        logWarn(`Failed to load setting ${settingKey}: ${String(err)}`);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per key
  }, [settingKey]);

  const update = (next: T) => {
    hasUpdatedRef.current = true;
    setValue(next);
    setSetting(settingKey, next).catch((err: unknown) => {
      logWarn(`Failed to persist setting ${settingKey}: ${String(err)}`);
    });
  };

  return [value, update] as const;
}
