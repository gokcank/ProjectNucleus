import { bluetoothWidget } from "./bluetooth/bluetooth-widget";
import { brightnessWidget } from "./brightness/brightness-widget";
import { calculatorWidget } from "./calculator/calculator-widget";
import { calendarWidget } from "./calendar/calendar-widget";
import { clipboardWidget } from "./clipboard/clipboard-widget";
import { clockWidget } from "./clock/clock-widget";
import { colorPickerWidget } from "./color-picker/color-picker-widget";
import { cpuWidget } from "./cpu/cpu-widget";
import { networkWidget } from "./network/network-widget";
import { nightLightWidget } from "./night-light/night-light-widget";
import { notesWidget } from "./notes/notes-widget";
import { pomodoroWidget } from "./pomodoro/pomodoro-widget";
import { powerProfileWidget } from "./power-profile/power-profile-widget";
import { powerWidget } from "./power/power-widget";
import { quickLinksWidget } from "./quick-links/quick-links-widget";
import { ramWidget } from "./ram/ram-widget";
import { registerWidget } from "./registry";
import { screenshotWidget } from "./screenshot/screenshot-widget";
import { stopwatchWidget } from "./stopwatch/stopwatch-widget";
import { timerWidget } from "./timer/timer-widget";
import { todoWidget } from "./todo/todo-widget";
import { volumeWidget } from "./volume/volume-widget";

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
    calculatorWidget,
    screenshotWidget,
    timerWidget,
    stopwatchWidget,
    volumeWidget,
    bluetoothWidget,
    nightLightWidget,
    powerProfileWidget,
    powerWidget,
    pomodoroWidget,
    calendarWidget,
    brightnessWidget,
  ].forEach(registerWidget);
}

export { getWidget, listWidgets, registerWidget } from "./registry";
export { useWidgetSetting } from "./use-widget-setting";
export type { WidgetDefinition } from "./types";
