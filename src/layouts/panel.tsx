import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { logWarn } from "../services/logger-service";

const EXIT_ANIMATION_MS = 150;

export function Panel({ children }: { children: ReactNode }) {
  const [exiting, setExiting] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const hideTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let appWindow: ReturnType<typeof getCurrentWindow>;
    try {
      appWindow = getCurrentWindow();
    } catch {
      // No Tauri runtime available (e.g. browser preview) — panel stays open.
      return;
    }

    const close = () => {
      if (hideTimer.current !== undefined) return;
      setExiting(true);
      hideTimer.current = window.setTimeout(() => {
        hideTimer.current = undefined;
        appWindow.hide().catch((err: unknown) => {
          logWarn(`Failed to hide panel: ${String(err)}`);
        });
      }, EXIT_ANIMATION_MS);
    };

    const cancelClose = () => {
      if (hideTimer.current !== undefined) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = undefined;
      }
      setExiting(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);

    let unlisten: (() => void) | undefined;
    appWindow
      .onFocusChanged(({ payload: focused }) => {
        if (focused) {
          // Re-entering the panel (including show after hide): replay the enter animation.
          cancelClose();
          setOpenCount((count) => count + 1);
        } else {
          close();
        }
      })
      .then((fn) => {
        unlisten = fn;
      })
      .catch((err: unknown) => {
        logWarn(`Panel focus tracking unavailable: ${String(err)}`);
      });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      unlisten?.();
      if (hideTimer.current !== undefined) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = undefined;
      }
    };
  }, []);

  return (
    <div className="h-screen w-screen p-6">
      <div
        key={openCount}
        className={`${exiting ? "panel-exit" : "panel-enter"} h-full w-full overflow-hidden rounded-3xl border border-black/10 bg-white/95 shadow-xl dark:border-white/10 dark:bg-neutral-900/95`}
      >
        {children}
      </div>
    </div>
  );
}
