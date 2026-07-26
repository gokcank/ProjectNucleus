import { logWarn } from "../../services/logger-service";
import type { WidgetDefinition } from "./types";

const widgets = new Map<string, WidgetDefinition>();

export function registerWidget(definition: WidgetDefinition) {
  if (widgets.has(definition.id)) {
    logWarn(`Widget "${definition.id}" is already registered; ignoring duplicate.`);
    return;
  }
  widgets.set(definition.id, definition);
}

export function getWidget(id: string): WidgetDefinition | undefined {
  return widgets.get(id);
}

export function listWidgets(): WidgetDefinition[] {
  return [...widgets.values()];
}
