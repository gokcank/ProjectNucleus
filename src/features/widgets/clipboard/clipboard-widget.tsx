import { ClipboardList, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { logWarn } from "../../../services/logger-service";
import { getClipboardText, setClipboardText } from "../../../services/clipboard-service";
import type { WidgetDefinition } from "../types";
import { addEntry, clearHistory, INITIAL_HISTORY } from "./clipboard-logic";

const POLL_INTERVAL_MS = 1500;

function ClipboardContent() {
  const [history, setHistory] = useState(INITIAL_HISTORY);

  // Polls the system clipboard directly rather than via `usePolling`: each tick needs to fold
  // the new value into history (via addEntry), not just replace a single "latest value" state.
  useEffect(() => {
    let active = true;

    const tick = () => {
      if (document.hidden) return;
      getClipboardText()
        .then((text) => {
          if (active) setHistory((prev) => addEntry(prev, text));
        })
        .catch((err: unknown) => {
          logWarn(`Clipboard unavailable, polling stopped: ${String(err)}`);
          window.clearInterval(intervalId);
        });
    };

    tick();
    const intervalId = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const handleCopy = (text: string) => {
    setClipboardText(text).catch((err: unknown) => {
      logWarn(`Failed to write clipboard: ${String(err)}`);
    });
  };

  if (history.entries.length === 0) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">No copied text yet.</p>
    );
  }

  return (
    <div className="mt-2">
      <ul className="space-y-1">
        {history.entries.map((entry, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => handleCopy(entry)}
              className="flex w-full items-center gap-2 rounded-[10px] bg-black/5 px-2 py-1.5 text-left text-sm text-neutral-900 hover:bg-black/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10"
            >
              <span className="min-w-0 flex-1 truncate">{entry}</span>
              <Copy size={14} className="shrink-0 text-neutral-500 dark:text-neutral-400" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setHistory(clearHistory())}
        className="mt-2 text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        Clear history
      </button>
    </div>
  );
}

export const clipboardWidget: WidgetDefinition = {
  id: "clipboard",
  title: "Clipboard",
  icon: ClipboardList,
  defaultWide: true,
  component: ClipboardContent,
};
