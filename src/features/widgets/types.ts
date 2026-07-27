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
   * Renders as a single row (icon, title and content sharing the header
   * line) instead of content stacked below the header. For status widgets
   * that reduce to one value, like a meter.
   */
  compact?: boolean;
  /**
   * Renders the card content only. The card chrome (surface, header,
   * actions) is owned by the dashboard host.
   */
  component: ComponentType;
}
