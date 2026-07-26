import { useEffect, useState } from "react";
import { logWarn } from "../../services/logger-service";
import { getSetting, setSetting } from "../../services/settings-service";

export interface CardLayoutEntry {
  id: string;
  wide: boolean;
}

const SETTING_KEY = "dashboard.layout";

export const DEFAULT_LAYOUT: CardLayoutEntry[] = [
  { id: "clock", wide: true },
  { id: "cpu", wide: false },
  { id: "ram", wide: false },
];

function isEntry(value: unknown): value is CardLayoutEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as CardLayoutEntry).id === "string" &&
    typeof (value as CardLayoutEntry).wide === "boolean"
  );
}

/**
 * Restores a stored layout while staying resilient to app changes:
 * unknown cards are dropped, newly introduced cards are appended
 * with their default placement.
 */
function reconcile(stored: unknown): CardLayoutEntry[] {
  if (!Array.isArray(stored)) return DEFAULT_LAYOUT;

  const known = stored
    .filter(isEntry)
    .filter(
      (entry, index, all) =>
        DEFAULT_LAYOUT.some((def) => def.id === entry.id) &&
        all.findIndex((other) => other.id === entry.id) === index,
    );
  const missing = DEFAULT_LAYOUT.filter((def) => !known.some((entry) => entry.id === def.id));
  return [...known, ...missing];
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState<CardLayoutEntry[]>(DEFAULT_LAYOUT);

  useEffect(() => {
    let cancelled = false;
    getSetting<CardLayoutEntry[]>(SETTING_KEY, DEFAULT_LAYOUT)
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

  const persist = (next: CardLayoutEntry[]) => {
    setLayout(next);
    setSetting(SETTING_KEY, next).catch((err: unknown) => {
      logWarn(`Failed to persist dashboard layout: ${String(err)}`);
    });
  };

  const toggleWide = (id: string) => {
    persist(layout.map((entry) => (entry.id === id ? { ...entry, wide: !entry.wide } : entry)));
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

  return { layout, toggleWide, moveCard };
}
