import { bluetoothWidget } from "./bluetooth/bluetooth-widget";
import { calculatorWidget } from "./calculator/calculator-widget";
import { clipboardWidget } from "./clipboard/clipboard-widget";
import { clockWidget } from "./clock/clock-widget";
import { colorPickerWidget } from "./color-picker/color-picker-widget";
import { cpuWidget } from "./cpu/cpu-widget";
import { nightLightWidget } from "./night-light/night-light-widget";
import { notesWidget } from "./notes/notes-widget";
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
    clockWidget,
    cpuWidget,
    ramWidget,
    calculatorWidget,
    clipboardWidget,
    notesWidget,
    timerWidget,
    stopwatchWidget,
    screenshotWidget,
    volumeWidget,
    bluetoothWidget,
    nightLightWidget,
    powerProfileWidget,
    powerWidget,
    colorPickerWidget,
    quickLinksWidget,
    todoWidget,
  ].forEach(registerWidget);
}

export { getWidget, listWidgets, registerWidget } from "./registry";
export { useWidgetSetting } from "./use-widget-setting";
export type { WidgetDefinition } from "./types";
