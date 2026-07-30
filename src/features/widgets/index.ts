import { batteryWidget } from "./battery/battery-widget";
import { clipboardWidget } from "./clipboard/clipboard-widget";
import { clockWidget } from "./clock/clock-widget";
import { colorPickerWidget } from "./color-picker/color-picker-widget";
import { cpuWidget } from "./cpu/cpu-widget";
import { networkWidget } from "./network/network-widget";
import { notesWidget } from "./notes/notes-widget";
import { pomodoroWidget } from "./pomodoro/pomodoro-widget";
import { qrCodeWidget } from "./qr-code/qr-code-widget";
import { quickLinksWidget } from "./quick-links/quick-links-widget";
import { ramWidget } from "./ram/ram-widget";
import { registerWidget } from "./registry";
import { screenRecorderWidget } from "./screen-recorder/screen-recorder-widget";
import { screenshotWidget } from "./screenshot/screenshot-widget";
import { stopwatchWidget } from "./stopwatch/stopwatch-widget";
import { timerWidget } from "./timer/timer-widget";
import { todoWidget } from "./todo/todo-widget";

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
    clockWidget,
    screenshotWidget,
    timerWidget,
    stopwatchWidget,
    pomodoroWidget,
    batteryWidget,
    qrCodeWidget,
    screenRecorderWidget,
  ].forEach(registerWidget);
}

export { getWidget, listWidgets, registerWidget } from "./registry";
export { useWidgetSetting } from "./use-widget-setting";
export type { WidgetDefinition } from "./types";
