import { getCurrentWindow } from "@tauri-apps/api/window";
import { Pipette } from "lucide-react";
import { useState } from "react";
import { setClipboardText } from "../../../services/clipboard-service";
import { pickColor, type PickedColor } from "../../../services/color-picker-service";
import { logWarn } from "../../../services/logger-service";
import type { WidgetDefinition } from "../types";

/**
 * Opening the portal takes focus away from Nucleus, which the panel answers by
 * hiding itself. The picked colour is the whole point of this widget, so bring
 * the panel back once there is one to show.
 */
function restorePanel() {
  let appWindow: ReturnType<typeof getCurrentWindow>;
  try {
    appWindow = getCurrentWindow();
  } catch {
    return; // No Tauri runtime (e.g. browser preview) — nothing to restore.
  }
  appWindow
    .show()
    .then(() => appWindow.setFocus())
    .catch((err: unknown) => {
      logWarn(`Could not bring the panel back after picking a color: ${String(err)}`);
    });
}

function ColorPickerContent() {
  const [color, setColor] = useState<PickedColor | null>(null);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => {
    setPicking(true);
    setError(null);
    pickColor()
      .then((result) => {
        // `null` means the user dismissed the desktop's color-picker dialog.
        if (!result) return;
        setColor(result);
        restorePanel();
      })
      .catch((err: unknown) => {
        logWarn(`Color pick failed: ${String(err)}`);
        setError("Couldn't pick a color.");
      })
      .finally(() => setPicking(false));
  };

  const copyHex = () => {
    if (!color) return;
    setClipboardText(color.hex).catch((err: unknown) => {
      logWarn(`Could not copy color: ${String(err)}`);
    });
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={pick}
        disabled={picking}
        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] bg-neutral-900 text-xs font-medium text-neutral-100 hover:bg-neutral-700 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        <Pipette size={14} />
        {picking ? "..." : "Pick"}
      </button>

      {error && <p className="mt-2 text-[11px] text-red-600 dark:text-red-400">{error}</p>}

      {color && (
        <button
          type="button"
          onClick={copyHex}
          title="Copy hex"
          className="mt-2 flex w-full items-center gap-1.5 rounded-[10px] bg-black/5 px-2 py-1.5 text-left dark:bg-white/5"
        >
          <span
            className="h-4 w-4 shrink-0 rounded-full border border-black/10 dark:border-white/10"
            style={{ backgroundColor: color.hex }}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate text-[11px] tabular-nums text-neutral-700 dark:text-neutral-200">
            {color.hex}
          </span>
        </button>
      )}
    </div>
  );
}

export const colorPickerWidget: WidgetDefinition = {
  id: "colorPicker",
  title: "Color",
  icon: Pipette,
  quarterWidth: true,
  component: ColorPickerContent,
};
