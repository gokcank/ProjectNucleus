import { useEffect, useState } from "react";
import { logWarn } from "../../services/logger-service";
import { getSetting, setSetting } from "../../services/settings-service";

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

  useEffect(() => {
    let cancelled = false;
    getSetting<unknown>(settingKey, fallback)
      .then((stored) => {
        if (!cancelled && isValid(stored)) setValue(stored);
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
    setValue(next);
    setSetting(settingKey, next).catch((err: unknown) => {
      logWarn(`Failed to persist setting ${settingKey}: ${String(err)}`);
    });
  };

  return [value, update] as const;
}
