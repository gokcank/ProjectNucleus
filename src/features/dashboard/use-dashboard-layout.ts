import { useEffect, useState } from "react";
import { logWarn } from "../../services/logger-service";
import { getSetting, setSetting } from "../../services/settings-service";
import { getWidget, listWidgets } from "../widgets";

export interface WidgetLayoutEntry {
  id: string;
  wide: boolean;
  /** Hidden widgets stay in the layout, keeping their place and size for when
   * they are switched back on in Settings. */
  hidden: boolean;
}

const SETTING_KEY = "dashboard.layout";

function defaultLayout(): WidgetLayoutEntry[] {
  return listWidgets().map((widget) => ({
    id: widget.id,
    wide: widget.defaultWide ?? false,
    hidden: false,
  }));
}

/**
 * `hidden` is checked loosely on purpose: layouts stored before Settings
 * existed have no such field, and must not be discarded because of it.
 */
function isEntry(value: unknown): value is { id: string; wide: boolean; hidden?: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "string" &&
    typeof (value as { wide?: unknown }).wide === "boolean"
  );
}

/**
 * Restores a stored layout while staying resilient to app changes:
 * unregistered widgets are dropped, newly introduced widgets are
 * appended with their default placement.
 */
function reconcile(stored: unknown): WidgetLayoutEntry[] {
  const defaults = defaultLayout();
  if (!Array.isArray(stored)) return defaults;

  const known = stored
    .filter(isEntry)
    .filter(
      (entry, index, all) =>
        getWidget(entry.id) !== undefined &&
        all.findIndex((other) => other.id === entry.id) === index,
    )
    .map((entry) => ({ id: entry.id, wide: entry.wide, hidden: entry.hidden === true }));

  const missing = defaults.filter((def) => !known.some((entry) => entry.id === def.id));
  return [...known, ...missing];
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState<WidgetLayoutEntry[]>(defaultLayout);

  useEffect(() => {
    let cancelled = false;
    getSetting<WidgetLayoutEntry[]>(SETTING_KEY, defaultLayout())
      .then((stored) => {
        if (!cancelled) setLayout(reconcile(stored));
      })
      .catch((err: unknown) => {
        logWarn(`Failed to load dashboard layout, using defaults: ${String(err)}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = (next: WidgetLayoutEntry[]) => {
    setLayout(next);
    setSetting(SETTING_KEY, next).catch((err: unknown) => {
      logWarn(`Failed to persist dashboard layout: ${String(err)}`);
    });
  };

  const toggleWide = (id: string) => {
    persist(layout.map((entry) => (entry.id === id ? { ...entry, wide: !entry.wide } : entry)));
  };

  const toggleHidden = (id: string) => {
    persist(layout.map((entry) => (entry.id === id ? { ...entry, hidden: !entry.hidden } : entry)));
  };

  const moveCard = (fromId: string, toId: string) => {
    const fromIndex = layout.findIndex((entry) => entry.id === fromId);
    const toIndex = layout.findIndex((entry) => entry.id === toId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;
    const next = [...layout];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    persist(next);
  };

  return { layout, toggleWide, toggleHidden, moveCard };
}

export type DashboardLayout = ReturnType<typeof useDashboardLayout>;
