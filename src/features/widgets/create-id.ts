/** A locally-unique id for a list item stored via `useWidgetSetting`. */
export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
