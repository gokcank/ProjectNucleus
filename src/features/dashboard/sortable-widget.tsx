import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Maximize2, Minimize2 } from "lucide-react";
import { Card } from "../../components/card/card";
import type { WidgetDefinition } from "../widgets";
import type { WidgetLayoutEntry } from "./use-dashboard-layout";

interface SortableWidgetProps {
  entry: WidgetLayoutEntry;
  definition: WidgetDefinition;
  onToggleWide: (id: string) => void;
  /**
   * Hides the card without unmounting it -- used when a dashboard search
   * doesn't match it. Filtering non-matching cards out of the rendered list
   * entirely would unmount them, discarding any in-progress state a card
   * keeps only in memory (a running Timer, Pomodoro, or Stopwatch).
   */
  hidden?: boolean;
}

const actionButtonClass =
  "rounded-md p-1 text-neutral-400 hover:bg-black/5 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-white/5 dark:hover:text-neutral-300";

export function SortableWidget({ entry, definition, onToggleWide, hidden }: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });

  const ResizeIcon = entry.wide ? Minimize2 : Maximize2;
  const Content = definition.component;

  const actions = (
    <>
      {!definition.quarterWidth && (
        <button
          type="button"
          onClick={() => onToggleWide(entry.id)}
          aria-label={entry.wide ? "Shrink card" : "Expand card"}
          className={actionButtonClass}
        >
          <ResizeIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </button>
      )}
      <button
        type="button"
        aria-label="Reorder card"
        className={`${actionButtonClass} cursor-grab touch-none active:cursor-grabbing`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      </button>
    </>
  );

  // Column span out of the dashboard's 4-column grid: a quarter-width widget
  // is fixed at 1, everything else keeps the existing half/full toggle
  // (2 or 4) exactly as before -- the grid grew, not the widgets.
  const spanClass = definition.quarterWidth
    ? "col-span-1"
    : entry.wide
      ? "col-span-4"
      : "col-span-2";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${spanClass} ${isDragging ? "z-10 opacity-80" : ""} ${hidden ? "hidden" : ""}`}
    >
      <Card
        icon={definition.icon}
        title={definition.title}
        actions={actions}
        inline={definition.compact}
        narrow={definition.quarterWidth}
      >
        <Content wide={entry.wide} />
      </Card>
    </div>
  );
}
