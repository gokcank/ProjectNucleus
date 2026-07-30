import { openUrl } from "@tauri-apps/plugin-opener";
import { Link2, Trash2 } from "lucide-react";
import { useState } from "react";
import { logWarn } from "../../../services/logger-service";
import { createId } from "../create-id";
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

// Must match what the app's `opener:default` capability actually allows
// (src-tauri/capabilities/default.json) — anything else silently fails to
// open, so it is rejected here rather than saved as a dead link.
const ALLOWED_SCHEMES = ["http:", "https:", "mailto:", "tel:"];

/** Assumes https:// when the user pastes a bare domain rather than a full URL. */
function normalizeUrl(input: string): string {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(input) ? input : `https://${input}`;
}

/** Returns the normalized URL, or `null` if its scheme can never be opened. */
function validateUrl(input: string): string | null {
  const normalized = normalizeUrl(input);
  try {
    const scheme = new URL(normalized).protocol;
    return ALLOWED_SCHEMES.includes(scheme) ? normalized : null;
  } catch {
    return null;
  }
}

function QuickLinksContent() {
  const [links, setLinks] = useWidgetSetting<QuickLink[]>(
    "quickLinks",
    "items",
    [],
    isQuickLinkList,
  );
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(false);

  const addLink = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const url = validateUrl(trimmed);
    if (!url) {
      setError(true);
      return;
    }
    setLinks([...links, { id: createId(), url }]);
    setDraft("");
    setError(false);
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
        onChange={(event) => {
          setDraft(event.target.value);
          setError(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") addLink();
        }}
        placeholder="Paste a URL…"
        aria-label="Add a quick link"
        className="w-full rounded-[10px] border border-black/10 bg-black/5 px-2 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
      />

      {error && (
        <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">
          Only web, email or phone links are supported.
        </p>
      )}

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
  defaultWide: false,
  component: QuickLinksContent,
};
