import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Maximize2, Minimize2 } from "lucide-react";
import type { ReactNode } from "react";
import type { CardLayoutEntry } from "./use-dashboard-layout";

interface SortableCardProps {
  entry: CardLayoutEntry;
  onToggleWide: (id: string) => void;
  render: (actions: ReactNode) => ReactNode;
}

const actionButtonClass =
  "rounded-md p-1 text-neutral-400 transition-colors hover:bg-black/5 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-white/5 dark:hover:text-neutral-300";

export function SortableCard({ entry, onToggleWide, render }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });

  const ResizeIcon = entry.wide ? Minimize2 : Maximize2;

  const actions = (
    <>
      <button
        type="button"
        onClick={() => onToggleWide(entry.id)}
        aria-label={entry.wide ? "Shrink card" : "Expand card"}
        className={actionButtonClass}
      >
        <ResizeIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      </button>
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

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${entry.wide ? "col-span-2" : ""} ${isDragging ? "z-10 opacity-80" : ""}`}
    >
      {render(actions)}
    </div>
  );
}
