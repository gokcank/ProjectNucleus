import { Camera, FolderOpen } from "lucide-react";
import { logWarn } from "../../../services/logger-service";
import {
  revealScreenshot,
  takeScreenshot,
  type SavedScreenshot,
} from "../../../services/screenshot-service";
import type { WidgetDefinition } from "../types";
import { usePortalAction } from "../use-portal-action";

/** Produces names like `nucleus-2026-07-26-18-45-12`, sorted chronologically by name. */
function buildFileStem(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    "nucleus",
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("-");
}

function ScreenshotContent() {
  const { result: saved, busy: capturing, error, run } = usePortalAction<SavedScreenshot>();

  const capture = () => {
    run(() => takeScreenshot(buildFileStem()), {
      logPrefix: "Screenshot failed:",
      message: "Could not take a screenshot.",
    });
  };

  const reveal = () => {
    if (!saved) return;
    revealScreenshot(saved.path).catch((err: unknown) => {
      logWarn(`Could not reveal screenshot: ${String(err)}`);
    });
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={capture}
        disabled={capturing}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-neutral-900 text-sm font-medium text-neutral-100 hover:bg-neutral-700 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        <Camera size={16} />
        {capturing ? "Waiting for capture..." : "Capture"}
      </button>

      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {saved && (
        <button
          type="button"
          onClick={reveal}
          title={saved.path}
          className="mt-2 flex w-full items-center gap-2 rounded-[10px] bg-black/5 px-2 py-1.5 text-left text-xs text-neutral-900 hover:bg-black/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10"
        >
          <span className="min-w-0 flex-1 truncate">{saved.fileName}</span>
          <FolderOpen size={14} className="shrink-0 text-neutral-500 dark:text-neutral-400" />
        </button>
      )}
    </div>
  );
}

export const screenshotWidget: WidgetDefinition = {
  id: "screenshot",
  title: "Screenshot",
  icon: Camera,
  defaultWide: false,
  component: ScreenshotContent,
};
