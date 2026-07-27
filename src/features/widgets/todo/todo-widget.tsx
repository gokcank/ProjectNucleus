import { Check, ListTodo, Trash2 } from "lucide-react";
import { useState } from "react";
import type { WidgetDefinition } from "../types";
import { useWidgetSetting } from "../use-widget-setting";

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

const isTodoItem = (value: unknown): value is TodoItem =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as TodoItem).id === "string" &&
  typeof (value as TodoItem).text === "string" &&
  typeof (value as TodoItem).done === "boolean";

const isTodoList = (value: unknown): value is TodoItem[] =>
  Array.isArray(value) && value.every(isTodoItem);

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function TodoContent() {
  const [items, setItems] = useWidgetSetting<TodoItem[]>("todo", "items", [], isTodoList);
  const [draft, setDraft] = useState("");

  const addItem = () => {
    const text = draft.trim();
    if (!text) return;
    setItems([...items, { id: createId(), text, done: false }]);
    setDraft("");
  };

  const toggleItem = (id: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="mt-2">
      <input
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") addItem();
        }}
        placeholder="Add a task…"
        aria-label="Add a task"
        className="w-full rounded-[10px] border border-black/10 bg-black/5 px-2 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
      />

      {items.length > 0 && (
        <ul className="mt-2 space-y-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                aria-pressed={item.done}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-black/5 px-2 py-1.5 text-left text-sm hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${
                    item.done
                      ? "border-neutral-900 bg-neutral-900 dark:border-neutral-100 dark:bg-neutral-100"
                      : "border-black/20 dark:border-white/20"
                  }`}
                >
                  {item.done && (
                    <Check size={12} className="text-neutral-100 dark:text-neutral-900" />
                  )}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate ${
                    item.done
                      ? "text-neutral-400 line-through dark:text-neutral-500"
                      : "text-neutral-900 dark:text-neutral-100"
                  }`}
                >
                  {item.text}
                </span>
              </button>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label="Remove task"
                className="shrink-0 rounded-md p-1.5 text-neutral-400 hover:bg-black/5 hover:text-neutral-600 dark:hover:bg-white/5 dark:hover:text-neutral-300"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const todoWidget: WidgetDefinition = {
  id: "todo",
  title: "Todo",
  icon: ListTodo,
  defaultWide: true,
  component: TodoContent,
};
