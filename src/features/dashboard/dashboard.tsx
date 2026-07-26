import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { LayoutGrid, Search } from "lucide-react";
import { useTheme } from "../../hooks/use-theme";
import { getWidget, type WidgetDefinition } from "../widgets";
import { SortableWidget } from "./sortable-widget";
import { useDashboardLayout } from "./use-dashboard-layout";

const THEMES = ["light", "dark", "system"] as const;

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <LayoutGrid
        className="h-8 w-8 text-neutral-400 dark:text-neutral-600"
        strokeWidth={1.5}
        aria-hidden
      />
      <p className="mt-3 text-sm font-medium text-neutral-600 dark:text-neutral-300">
        No cards yet
      </p>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        Cards will appear here in upcoming releases.
      </p>
    </div>
  );
}

export function Dashboard() {
  const { theme, setTheme } = useTheme();
  const { layout, toggleWide, moveCard } = useDashboardLayout();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      moveCard(String(active.id), String(over.id));
    }
  };

  const entries = layout
    .map((entry) => ({ entry, definition: getWidget(entry.id) }))
    .filter(
      (item): item is { entry: (typeof layout)[number]; definition: WidgetDefinition } =>
        item.definition !== undefined,
    );

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-black/5 px-4 py-3 dark:border-white/5">
        <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Nucleus</h1>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            aria-label="Search cards and widgets"
            placeholder="Search…"
            className="w-full rounded-[10px] border border-black/10 bg-black/5 py-1.5 pr-3 pl-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {entries.length === 0 ? (
          <EmptyState />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={entries.map((item) => item.entry.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 gap-3">
                {entries.map((item) => (
                  <SortableWidget
                    key={item.entry.id}
                    entry={item.entry}
                    definition={item.definition}
                    onToggleWide={toggleWide}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <footer className="flex items-center justify-center gap-2 border-t border-black/5 px-4 py-2 dark:border-white/5">
        {THEMES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTheme(option)}
            aria-pressed={theme === option}
            className={`rounded-[10px] px-2.5 py-1 text-xs capitalize transition-colors ${
              theme === option
                ? "bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                : "text-neutral-500 hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/5"
            }`}
          >
            {option}
          </button>
        ))}
      </footer>
    </div>
  );
}
