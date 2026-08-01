# 🧩 Project Nucleus

> **Widget API**
>
> **Version:** 1.0
>
> **Status:** Phase 5 — Widget Engine

---

# Overview

A widget is a self-contained dashboard entry: an icon, a title, a content component, and an optional default size. The dashboard host owns everything a widget does not: the card surface, the header, resize and drag actions, and layout persistence.

This document describes the widget API as it exists today. It is not a future design — it is the contract every built-in widget already uses. New capabilities are added to this document only when a real widget needs them, per `docs/DECISIONS.md` (ADR-005, ADR-006).

---

# Defining a Widget

A widget is a plain object matching `WidgetDefinition` (`src/features/widgets/types.ts`):

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique, stable identifier. Also used as the layout persistence key — never change it once shipped. |
| `title` | `string` | Yes | Shown in the card header. |
| `keywords` | `string[]` | No | Extra terms the dashboard search matches besides the title. For widgets people look for under a name that will not fit in the header — Color registers `picker`, since "Color Picker" would be truncated in a quarter-width card. Do not restate words already in the title. |
| `icon` | `LucideIcon` | Yes | Per `docs/UI_GUIDELINES.md`, Lucide only. |
| `defaultWide` | `boolean` | No | Whether the widget spans full dashboard width the first time it's placed. Defaults to `false`. |
| `compact` | `boolean` | No | Renders as a single row — icon, title and content share the header line instead of content sitting below it. For status widgets that reduce to one value, paired with `InlineMeter` (`src/components/card/inline-meter.tsx`). Defaults to `false`. |
| `quarterWidth` | `boolean` | No | Fixes the card at a quarter of the dashboard's width (out of its 4-column grid) so several fit in one row. Not user-resizable — no expand/shrink action is shown. Reserve for widgets genuinely that small (see Color Picker); most widgets should use the default half/full toggle instead. Defaults to `false`. |
| `component` | `ComponentType<{ wide: boolean }>` | Yes | Renders content only — no surface, no border, no header. The host supplies those. Receives `wide`, so a widget can show more detail when it has the room (see RAM). |

Convention: one folder per widget under `src/features/widgets/<id>/`, one file `<id>-widget.tsx` exporting the definition as `<id>Widget`.

```tsx
// src/features/widgets/notes/notes-widget.tsx
export const notesWidget: WidgetDefinition = {
  id: "notes",
  title: "Notes",
  icon: StickyNote,
  defaultWide: true,
  component: NotesContent,
};
```

---

# Registration

Widgets register themselves through `registerWidget` (`src/features/widgets/registry.ts`). Built-in widgets are registered once at startup via `registerBuiltinWidgets()`, called from `main.tsx` before the app renders.

```ts
import { registerWidget } from "../registry";
registerWidget(notesWidget);
```

Registering a duplicate `id` is ignored with a logged warning — it does not crash the app or overwrite the existing definition.

The dashboard never imports a widget component directly. It only calls `getWidget(id)` and `listWidgets()`. This is the boundary that keeps the core small (ADR-011): adding a widget means registering it, not editing dashboard code.

---

# Lifecycle

There is no mount/unmount hook beyond what React itself provides. A widget's `component` is a normal React component — use `useEffect` for setup/teardown (timers, subscriptions) exactly as the built-in widgets do.

A widget can be switched off by the user from the Settings screen. A hidden widget keeps its entry in the stored layout — its position and size survive being switched off and back on — but the dashboard does not render it, so its component is unmounted and its timers and subscriptions stop. Widgets need no code to support this; visibility is entirely the host's concern.

---

# Layout & Persistence

The dashboard (`src/features/dashboard/use-dashboard-layout.ts`) owns *where* a widget sits, not the widget itself:

- Order, size (`wide: boolean`) and visibility (`hidden: boolean`) are persisted to `settings.json` under the key `dashboard.layout`, via the Settings Service (`docs/ARCHITECTURE.md` → Service Layer).
- On load, stored entries referencing an unregistered widget are dropped; newly registered widgets not yet in the stored layout are appended with their `defaultWide`. This keeps the layout resilient across app updates without a migration step.
- Users reorder widgets via the drag handle and resize via the expand/shrink action, both rendered by the host — a widget cannot opt out of being reordered or resized.

---

# Widget Settings

A widget that needs its own persisted preference (distinct from dashboard layout) uses `useWidgetSetting` (`src/features/widgets/use-widget-setting.ts`):

```ts
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";
const [sparkline, setSparkline] = useWidgetSetting("ram", "sparkline", false, isBoolean);
```

| Parameter | Description |
|---|---|
| `widgetId` | Must match the widget's `id`. Scopes the storage key so widgets can never collide. |
| `key` | Setting name, unique within the widget. |
| `fallback` | Value used before the stored setting loads, and when nothing is stored yet. |
| `isValid` | Type guard run against the loaded value; invalid or corrupted data falls back rather than crashing. |

Storage key shape: `widget.<widgetId>.<key>`, persisted through the same Settings Service as dashboard layout and theme. There is no widget-specific settings UI yet — widgets expose their own inline controls (see the RAM widget's sparkline toggle) until a dedicated per-widget settings surface exists.

`T` isn't limited to primitives — Quick Links and Todo each store an array of records this way (e.g. `useWidgetSetting<QuickLink[]>("quickLinks", "items", [], isQuickLinkList)`). This fits because their edits (add/remove) are discrete clicks; a widget with rapid-fire edits (continuous typing, a drag) should debounce writes directly through the Settings Service instead, like Notes does — `useWidgetSetting` always persists immediately.

---

# Discovery

`listWidgets()` returns every registered widget. This is what the dashboard search (`docs/ROADMAP.md` → Phase 2 search scope) will query once search actually filters — today it is also how the dashboard enumerates what to render.

Dashboard search matches a widget's `title` and its `keywords`, so a widget whose common name is longer than its header can still be found by it.

---

# What Is Deliberately Not Here Yet

Per ADR-006 (Delay the Widget Engine) and the "build concrete examples first" principle, the following are intentionally absent until a real widget needs them:

- A public/third-party widget SDK (Phase 11).
- Per-widget permission or sandboxing model.
- Inter-widget communication.
- A per-widget settings surface (widgets still expose their own inline controls).
- Async or lazy widget loading.

Do not add these speculatively. Add a widget that needs the capability first, then extend this document to match.

---

# Reference Implementations

| Widget | File | Demonstrates |
|---|---|---|
| CPU | `src/features/widgets/cpu/cpu-widget.tsx` | Polling a Rust command via the Service Layer; own poll loop (not a shared hook) since it keeps a rolling history for the optional sparkline; `compact` layout |
| RAM | `src/features/widgets/ram/ram-widget.tsx` | Same polling/history pattern; `compact` layout, exact byte counts as a hover tooltip when narrow and as visible text when `wide` |
| Clipboard | `src/features/widgets/clipboard/clipboard-widget.tsx` | Polling a Tauri plugin (not a custom Rust command); in-memory-only history, deliberately not persisted since clipboard content may be sensitive |
| Notes | `src/features/widgets/notes/notes-widget.tsx` | Debounced writes straight through the Settings Service; bypasses `useWidgetSetting` since that hook always persists immediately |
| Timer | `src/features/widgets/timer/timer-widget.tsx` | Pure countdown logic (`timer-logic.ts`); drift-free ticking via `Date.now()` deltas instead of assuming fixed interval steps |
| Stopwatch | `src/features/widgets/stopwatch/stopwatch-widget.tsx` | Same drift-free ticking pattern as Timer, counting up instead of down |
| Pomodoro | `src/features/widgets/pomodoro/pomodoro-widget.tsx` | A multi-phase state machine in pure logic (`pomodoro-logic.ts`): phase transitions, cycle counting, and a deliberate refusal to auto-start the next phase; `keywords` so search finds it under "focus" |
| Battery | `src/features/widgets/battery/battery-widget.tsx` | A slow poll (30s) leaning on `usePolling`'s refresh-on-visible so the card is current the moment the panel opens. Combines UPower's composite device (the machine's own battery) with its per-device list (wireless mouse, headset, phone), told apart by `PowerSupply`; having neither is a state, not an error |
| Hardware | `src/features/widgets/hardware/hardware-widget.tsx` | The only widget that reads once and never polls — nothing it shows can change while the machine is running, so a plain `useEffect` replaces `usePolling`. Values wrap instead of truncating, since a half-shown product name can be neither read nor copied, and nothing disables text selection anywhere in the app. `commands/hardware.rs` owns `cpu_model()`, which the Temperature card borrows for its tooltip: which processor this is is a fact about the hardware, not a sensor reading |
| Weather | `src/features/widgets/weather/weather-widget.tsx` | The only widget that leaves the machine, and the first where typed text reaches a URL — the query is percent-encoded against a deliberately tiny unreserved set, length-capped, and handed to a process that never sees a shell. Two commands with different rhythms: the city search runs on demand through `useAsyncAction`, the reading polls on a 15-minute loop (what the service itself refreshes at) and leans on `usePolling`'s keep-last-value so a dropped connection shows stale data rather than an error. The `settle` helper is the interesting bit of product logic: one result named what was typed is taken silently, several are put to the user, which is what separates "Istanbul" (plus its airport) from four real Springfields |
| Disk | `src/features/widgets/disk/disk-widget.tsx` | `defaultWide: true` earning its place: volume names are whatever the owner labelled the drive, and each sits beside a size that will not wrap, so at half width the name is squeezed to a few characters — the card asks for the room instead of shortening what it shows. Leans on `sysinfo`'s own filtering (loop devices, in-memory filesystems and the firmware store never arrive) and adds only what it cannot know: the boot partition and network shares. Reuses `statusForCharge` unchanged, since free space and battery charge are the same reading — low is the bad end |
| Temperature | `src/features/widgets/sensors/sensors-widget.tsx` | Curation as the design decision: the kernel publishes nineteen temperatures on this machine and the card carries three kinds of them, skipping per-core readings and unlabelled motherboard zones that mean nothing at a glance. Reads `/sys/class/hwmon` directly rather than through `sysinfo`, which flattens chip name and sensor label into one string the curation would have to take apart again — and falls back to `nvidia-smi` for NVIDIA cards, which publish nothing to hwmon, remembering a first failure so machines without the tool never pay for the spawn. Long model names are the short maker name when narrow and the full model when `wide`, following RAM |
| Color Picker | `src/features/widgets/color-picker/color-picker-widget.tsx` | A privileged action delegated to the desktop through an XDG portal, distinguishing user cancellation from failure; `quarterWidth: true` since there's nothing to show at a larger size; `keywords` so search finds it under its longer common name |
| Quick Links | `src/features/widgets/quick-links/quick-links-widget.tsx` | An array stored via `useWidgetSetting` (not just a single value) — add/remove are discrete clicks, so no debounce is needed |
| Todo | `src/features/widgets/todo/todo-widget.tsx` | Same array-via-`useWidgetSetting` pattern as Quick Links, applied to a checklist |
| Network | `src/features/widgets/network/network-widget.tsx` | Three reads with different costs in one card: connection state comes from D-Bus on mount and on `visibilitychange` rather than being polled; throughput is a genuine rate, so it gets CPU/RAM's polling treatment instead, computed from `sysinfo`'s per-interface byte counters against real elapsed time (not an assumed interval) so it stays honest across the gaps polling leaves while the panel is hidden; the public address leaves the machine and so is fetched once and then only on demand, via `useAsyncAction` |
