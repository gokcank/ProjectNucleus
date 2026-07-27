import { openUrl } from "@tauri-apps/plugin-opener";
import { Link2, Trash2 } from "lucide-react";
import { useState } from "react";
import { logWarn } from "../../../services/logger-service";
import type { WidgetDefinition } from "../types";
import { useWidgetSetting } from "../use-widget-setting";

interface QuickLink {
  id: string;
  url: string;
}

const isQuickLink = (value: unknown): value is QuickLink =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as QuickLink).id === "string" &&
  typeof (value as QuickLink).url === "string";

const isQuickLinkList = (value: unknown): value is QuickLink[] =>
  Array.isArray(value) && value.every(isQuickLink);

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Assumes https:// when the user pastes a bare domain rather than a full URL. */
function normalizeUrl(input: string): string {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(input) ? input : `https://${input}`;
}

function QuickLinksContent() {
  const [links, setLinks] = useWidgetSetting<QuickLink[]>(
    "quickLinks",
    "items",
    [],
    isQuickLinkList,
  );
  const [draft, setDraft] = useState("");

  const addLink = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setLinks([...links, { id: createId(), url: normalizeUrl(trimmed) }]);
    setDraft("");
  };

  const removeLink = (id: string) => {
    setLinks(links.filter((link) => link.id !== id));
  };

  const openLink = (url: string) => {
    openUrl(url).catch((err: unknown) => {
      logWarn(`Could not open link: ${String(err)}`);
    });
  };

  return (
    <div className="mt-2">
      <input
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") addLink();
        }}
        placeholder="Paste a URL…"
        aria-label="Add a quick link"
        className="w-full rounded-[10px] border border-black/10 bg-black/5 px-2 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
      />

      {links.length > 0 && (
        <ul className="mt-2 space-y-1">
          {links.map((link) => (
            <li key={link.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => openLink(link.url)}
                title={link.url}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-black/5 px-2 py-1.5 text-left text-sm text-neutral-900 hover:bg-black/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10"
              >
                <Link2 size={14} className="shrink-0 text-neutral-500 dark:text-neutral-400" />
                <span className="min-w-0 flex-1 truncate">{link.url}</span>
              </button>
              <button
                type="button"
                onClick={() => removeLink(link.id)}
                aria-label="Remove link"
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

export const quickLinksWidget: WidgetDefinition = {
  id: "quickLinks",
  title: "Quick Links",
  icon: Link2,
  defaultWide: true,
  component: QuickLinksContent,
};
