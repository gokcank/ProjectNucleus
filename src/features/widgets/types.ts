import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export interface WidgetDefinition {
  /** Unique, stable identifier. Also used as the layout persistence key. */
  id: string;
  /** Human-readable name shown in the card header and used by discovery. */
  title: string;
  /**
   * Extra terms the dashboard search should match besides the title, for
   * widgets people look for under a name that will not fit in the header
   * (e.g. Color, which users search for as "picker").
   */
  keywords?: string[];
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
   * Fixes the card at a quarter of the dashboard's width, letting several
   * sit in one row. Not user-resizable — there is nothing extra to show at
   * a larger size, so no expand/shrink action is rendered. Reserve this for
   * widgets that are genuinely that small (see Color Picker); most widgets
   * should use the normal half/full toggle instead.
   */
  quarterWidth?: boolean;
  /**
   * Renders the card content only. The card chrome (surface, header,
   * actions) is owned by the dashboard host. Receives whether the widget is
   * currently placed wide, for widgets that show extra detail with the
   * extra room (e.g. RAM's exact byte counts).
   */
  component: ComponentType<{ wide: boolean }>;
}
