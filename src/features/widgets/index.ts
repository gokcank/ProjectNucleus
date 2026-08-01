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

/** Registers every built-in widget. Called once at application startup. */
export function registerBuiltinWidgets() {
  if (registered) return;
  registered = true;
  [
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
  ].forEach(registerWidget);
}

export { getWidget, listWidgets, registerWidget } from "./registry";
export { useWidgetSetting } from "./use-widget-setting";
export type { WidgetDefinition } from "./types";
