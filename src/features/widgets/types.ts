import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export interface WidgetDefinition {
  /** Unique, stable identifier. Also used as the layout persistence key. */
  id: string;
  /** Human-readable name shown in the card header and used by discovery. */
  title: string;
  icon: LucideIcon;
  /** Whether the widget spans the full dashboard width by default. */
  defaultWide?: boolean;
  /**
   * Renders the card content only. The card chrome (surface, header,
   * actions) is owned by the dashboard host.
   */
  component: ComponentType;
}
