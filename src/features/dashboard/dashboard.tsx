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
import { LayoutGrid, Search, SearchX, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { getWidget, type WidgetDefinition } from "../widgets";
import { SortableWidget } from "./sortable-widget";
import type { DashboardLayout } from "./use-dashboard-layout";

interface DashboardProps {
  layout: DashboardLayout;
  onOpenSettings: () => void;
}

/** Matches the card's own name plus any extra terms it registered. */
function matchesQuery(definition: WidgetDefinition, query: string): boolean {
  const needle = query.toLowerCase();
  if (definition.title.toLowerCase().includes(needle)) return true;
  return (definition.keywords ?? []).some((keyword) => keyword.toLowerCase().includes(needle));
}

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
        Turn widgets on in Settings to fill the dashboard.
      </p>
    </div>
  );
}

function NoMatches({ query }: { query: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <SearchX
        className="h-8 w-8 text-neutral-400 dark:text-neutral-600"
        strokeWidth={1.5}
        aria-hidden
      />
      <p className="mt-3 text-sm font-medium text-neutral-600 dark:text-neutral-300">
        Nothing matches “{query}”
      </p>
    </div>
  );
}

export function Dashboard({ layout: dashboardLayout, onOpenSettings }: DashboardProps) {
  const { layout, toggleWide, moveCard } = dashboardLayout;
  const [query, setQuery] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      moveCard(String(active.id), String(over.id));
    }
  };

  const trimmedQuery = query.trim();
  const searching = trimmedQuery !== "";

  const entries = layout
    .filter((entry) => !entry.hidden)
    .map((entry) => ({ entry, definition: getWidget(entry.id) }))
    .filter(
      (item): item is { entry: (typeof layout)[number]; definition: WidgetDefinition } =>
        item.definition !== undefined,
    )
    .filter((item) => matchesQuery(item.definition, trimmedQuery));

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
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search cards and widgets"
            placeholder="Search…"
            className="w-full rounded-[10px] border border-black/10 bg-black/5 py-1.5 pr-3 pl-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
          />
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open settings"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/5"
        >
          <SettingsIcon size={16} />
        </button>
      </header>

      <div className="flex-1 overflow-x-hidden overflow-y-auto p-4">
        {entries.length === 0 ? (
          searching ? (
            <NoMatches query={trimmedQuery} />
          ) : (
            <EmptyState />
          )
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            // The grid always fits within the panel -- there's nothing to
            // scroll to reveal. Without this, dragging a card near the edge
            // made dnd-kit auto-scroll the dashboard sideways, exposing
            // blank space the fixed 4-column grid doesn't actually have.
            autoScroll={false}
          >
            <SortableContext
              items={entries.map((item) => item.entry.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-4 gap-3">
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
    </div>
  );
}
