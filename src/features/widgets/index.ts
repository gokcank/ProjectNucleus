import { clockWidget } from "./clock/clock-widget";
import { cpuWidget } from "./cpu/cpu-widget";
import { ramWidget } from "./ram/ram-widget";
import { registerWidget } from "./registry";

let registered = false;

/** Registers every built-in widget. Called once at application startup. */
export function registerBuiltinWidgets() {
  if (registered) return;
  registered = true;
  [clockWidget, cpuWidget, ramWidget].forEach(registerWidget);
}

export { getWidget, listWidgets, registerWidget } from "./registry";
export type { WidgetDefinition } from "./types";
