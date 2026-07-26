# 🧩 Project Nucleus

> **Widget API**
>
> **Version:** 1.0
>
> **Status:** Phase 5 — Widget Engine

---

# Overview

A widget is a self-contained dashboard entry: an icon, a title, a content component, and an optional default size. The dashboard host owns everything a widget does not: the card surface, the header, resize and drag actions, and layout persistence.

This document describes the widget API as it exists today. It is not a future design — it is the contract already used by the three built-in widgets (Clock, CPU, RAM). New capabilities are added to this document only when a real widget needs them, per `docs/DECISIONS.md` (ADR-005, ADR-006).

---

# Defining a Widget

A widget is a plain object matching `WidgetDefinition` (`src/features/widgets/types.ts`):

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique, stable identifier. Also used as the layout persistence key — never change it once shipped. |
| `title` | `string` | Yes | Shown in the card header. |
| `icon` | `LucideIcon` | Yes | Per `docs/UI_GUIDELINES.md`, Lucide only. |
| `defaultWide` | `boolean` | No | Whether the widget spans full dashboard width the first time it's placed. Defaults to `false`. |
| `component` | `ComponentType` | Yes | Renders content only — no surface, no border, no header. The host supplies those. |

Convention: one folder per widget under `src/features/widgets/<id>/`, one file `<id>-widget.tsx` exporting the definition as `<id>Widget`.

```tsx
// src/features/widgets/clock/clock-widget.tsx
export const clockWidget: WidgetDefinition = {
  id: "clock",
  title: "Clock",
  icon: Clock,
  defaultWide: true,
  component: ClockContent,
};
```

---

# Registration

Widgets register themselves through `registerWidget` (`src/features/widgets/registry.ts`). Built-in widgets are registered once at startup via `registerBuiltinWidgets()`, called from `main.tsx` before the app renders.

```ts
import { registerWidget } from "../registry";
registerWidget(clockWidget);
```

Registering a duplicate `id` is ignored with a logged warning — it does not crash the app or overwrite the existing definition.

The dashboard never imports a widget component directly. It only calls `getWidget(id)` and `listWidgets()`. This is the boundary that keeps the core small (ADR-011): adding a widget means registering it, not editing dashboard code.

---

# Lifecycle

There is no mount/unmount hook beyond what React itself provides. A widget's `component` is a normal React component — use `useEffect` for setup/teardown (timers, subscriptions) exactly as the built-in widgets do.

There is currently no "widget disabled by user" state — every registered widget is eligible to appear in the layout. Per-widget enable/disable is expected to arrive alongside the Settings screen (Phase 6+) and will be documented here when it lands.

---

# Layout & Persistence

The dashboard (`src/features/dashboard/use-dashboard-layout.ts`) owns *where* a widget sits, not the widget itself:

- Order and size (`wide: boolean`) are persisted to `settings.json` under the key `dashboard.layout`, via the Settings Service (`docs/ARCHITECTURE.md` → Service Layer).
- On load, stored entries referencing an unregistered widget are dropped; newly registered widgets not yet in the stored layout are appended with their `defaultWide`. This keeps the layout resilient across app updates without a migration step.
- Users reorder widgets via the drag handle and resize via the expand/shrink action, both rendered by the host — a widget cannot opt out of being reordered or resized.

---

# Widget Settings

A widget that needs its own persisted preference (distinct from dashboard layout) uses `useWidgetSetting` (`src/features/widgets/use-widget-setting.ts`):

```ts
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";
const [showSeconds, setShowSeconds] = useWidgetSetting("clock", "showSeconds", true, isBoolean);
```

| Parameter | Description |
|---|---|
| `widgetId` | Must match the widget's `id`. Scopes the storage key so widgets can never collide. |
| `key` | Setting name, unique within the widget. |
| `fallback` | Value used before the stored setting loads, and when nothing is stored yet. |
| `isValid` | Type guard run against the loaded value; invalid or corrupted data falls back rather than crashing. |

Storage key shape: `widget.<widgetId>.<key>`, persisted through the same Settings Service as dashboard layout and theme. There is no widget-specific settings UI yet — widgets expose their own inline controls (see the Clock widget's seconds toggle) until a dedicated per-widget settings surface exists.

---

# Discovery

`listWidgets()` returns every registered widget. This is what the dashboard search (`docs/ROADMAP.md` → Phase 2 search scope) will query once search actually filters — today it is also how the dashboard enumerates what to render.

---

# What Is Deliberately Not Here Yet

Per ADR-006 (Delay the Widget Engine) and the "build concrete examples first" principle, the following are intentionally absent until a real widget needs them:

- A public/third-party widget SDK (Phase 11).
- Per-widget permission or sandboxing model.
- Inter-widget communication.
- Widget-level enable/disable toggle.
- Async or lazy widget loading.

Do not add these speculatively. Add a widget that needs the capability first, then extend this document to match.

---

# Reference Implementations

| Widget | File | Demonstrates |
|---|---|---|
| Clock | `src/features/widgets/clock/clock-widget.tsx` | Local timer state, a widget-owned setting (`showSeconds`) |
| CPU | `src/features/widgets/cpu/cpu-widget.tsx` | Polling a Rust command via the Service Layer, shared `usePolling` hook |
| RAM | `src/features/widgets/ram/ram-widget.tsx` | Same polling pattern, formatted derived values |
| Calculator | `src/features/widgets/calculator/calculator-widget.tsx` | Pure UI-independent state-transition logic (`calculator-logic.ts`) |
| Clipboard | `src/features/widgets/clipboard/clipboard-widget.tsx` | Polling a Tauri plugin (not a custom Rust command); in-memory-only history, deliberately not persisted since clipboard content may be sensitive |
| Notes | `src/features/widgets/notes/notes-widget.tsx` | Debounced writes straight through the Settings Service; bypasses `useWidgetSetting` since that hook always persists immediately |
| Timer | `src/features/widgets/timer/timer-widget.tsx` | Pure countdown logic (`timer-logic.ts`); drift-free ticking via `Date.now()` deltas instead of assuming fixed interval steps |
| Stopwatch | `src/features/widgets/stopwatch/stopwatch-widget.tsx` | Same drift-free ticking pattern as Timer, counting up instead of down |
| Screenshot | `src/features/widgets/screenshot/screenshot-widget.tsx` | A privileged action delegated to the desktop (XDG portal) via an async Rust command; distinguishes user cancellation from failure |
| Volume | `src/features/widgets/volume/volume-widget.tsx` | Two-way system control: reads on mount and on `visibilitychange` instead of polling, because each read costs a process spawn |
| Bluetooth | `src/features/widgets/bluetooth/bluetooth-widget.tsx` | Talks to a system D-Bus service (BlueZ) directly from Rust; models "no adapter present" as a state rather than an error |
