import { batteryWidget } from "./battery/battery-widget";
import { clipboardWidget } from "./clipboard/clipboard-widget";
import { colorPickerWidget } from "./color-picker/color-picker-widget";
import { cpuWidget } from "./cpu/cpu-widget";
import { diskWidget } from "./disk/disk-widget";
import { hardwareWidget } from "./hardware/hardware-widget";
import { networkWidget } from "./network/network-widget";
import { notesWidget } from "./notes/notes-widget";
import { pomodoroWidget } from "./pomodoro/pomodoro-widget";
import { quickLinksWidget } from "./quick-links/quick-links-widget";
import { ramWidget } from "./ram/ram-widget";
import { registerWidget } from "./registry";
import { sensorsWidget } from "./sensors/sensors-widget";
import { stopwatchWidget } from "./stopwatch/stopwatch-widget";
import { timerWidget } from "./timer/timer-widget";
import { todoWidget } from "./todo/todo-widget";
import { weatherWidget } from "./weather/weather-widget";

let registered = false;

/**
 * Set by the backend before this script runs (see `commands/runtime.rs`).
 * Undefined outside Tauri — a browser preview, for instance — which reads as
 * "not sandboxed", the right default everywhere except Flatpak itself.
 */
declare global {
  interface Window {
    __NUCLEUS_FLATPAK__?: boolean;
  }
}

/** Registers every built-in widget. Called once at application startup. */
export function registerBuiltinWidgets() {
  if (registered) return;
  registered = true;

  const widgets = [
    cpuWidget,
    ramWidget,
    clipboardWidget,
    notesWidget,
    colorPickerWidget,
    networkWidget,
    quickLinksWidget,
    todoWidget,
    timerWidget,
    stopwatchWidget,
    pomodoroWidget,
    batteryWidget,
    sensorsWidget,
    diskWidget,
    weatherWidget,
    hardwareWidget,
  ];

  // Inside Flatpak the kernel's mount table describes the sandbox, not the
  // machine: the root filesystem reads as the container's own temporary one
  // and a dozen container-internal mounts sit alongside it. No permission
  // fixes that -- the host's mount table simply is not reachable -- so the
  // card is left out there rather than shown reporting the wrong drives.
  const usable = window.__NUCLEUS_FLATPAK__ ? widgets.filter((w) => w !== diskWidget) : widgets;

  usable.forEach(registerWidget);
}

export { getWidget, listWidgets, registerWidget } from "./registry";
export { useWidgetSetting } from "./use-widget-setting";
export type { WidgetDefinition } from "./types";
