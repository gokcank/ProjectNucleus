import { StickyNote } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { logWarn } from "../../../services/logger-service";
import { getSetting, setSetting } from "../../../services/settings-service";
import type { WidgetDefinition } from "../types";

const SETTING_KEY = "widget.notes.content";
const SAVE_DELAY_MS = 400;

function NotesContent() {
  const [draft, setDraft] = useState("");
  const saveTimeoutRef = useRef<number>(undefined);

  // Loads once on mount. Unlike `useWidgetSetting`, persistence here is debounced rather than
  // immediate, so this widget manages the setting directly instead of through that hook.
  useEffect(() => {
    let cancelled = false;
    getSetting<string>(SETTING_KEY, "")
      .then((stored) => {
        if (!cancelled) setDraft(stored);
      })
      .catch((err: unknown) => {
        logWarn(`Failed to load setting ${SETTING_KEY}: ${String(err)}`);
      });
    return () => {
      cancelled = true;
      window.clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    setDraft(next);
    window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      setSetting(SETTING_KEY, next).catch((err: unknown) => {
        logWarn(`Failed to persist setting ${SETTING_KEY}: ${String(err)}`);
      });
    }, SAVE_DELAY_MS);
  };

  return (
    <textarea
      value={draft}
      onChange={handleChange}
      placeholder="Write a note..."
      rows={4}
      className="mt-2 w-full resize-none rounded-[10px] bg-black/5 p-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:bg-white/5 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-600"
    />
  );
}

export const notesWidget: WidgetDefinition = {
  id: "notes",
  title: "Notes",
  icon: StickyNote,
  defaultWide: true,
  component: NotesContent,
};
