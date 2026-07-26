import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { logWarn } from "../services/logger-service";

const EXIT_ANIMATION_MS = 150;

interface PanelProps {
  children: ReactNode;
  /**
   * Called before Escape closes the panel. Return true if the view dealt with
   * Escape itself (stepping back out of a sub-view, say) to keep the panel open.
   */
  onEscape?: () => boolean;
}

export function Panel({ children, onEscape }: PanelProps) {
  const [exiting, setExiting] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);
  const surface = useRef<HTMLDivElement>(null);
  // Held in a ref so the listener below can stay registered for the panel's
  // lifetime instead of being torn down whenever the handler identity changes.
  const escapeHandler = useRef(onEscape);
  useEffect(() => {
    escapeHandler.current = onEscape;
  }, [onEscape]);

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
      if (event.key !== "Escape") return;
      if (escapeHandler.current?.()) return;
      close();
    };
    window.addEventListener("keydown", onKeyDown);

    let unlisten: (() => void) | undefined;
    appWindow
      .onFocusChanged(({ payload: focused }) => {
        if (focused) {
          // Re-entering the panel (including show after hide): replay the enter
          // animation. Restarting it in place rather than remounting matters --
          // remounting would wipe every widget's state, resetting a running
          // timer or a half-typed note each time the panel is summoned.
          cancelClose();
          const element = surface.current;
          if (element) {
            element.style.animation = "none";
            element.getBoundingClientRect(); // force a reflow so it can start over
            element.style.animation = "";
          }
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
        ref={surface}
        className={`${exiting ? "panel-exit" : "panel-enter"} h-full w-full overflow-hidden rounded-3xl border border-black/10 bg-white/95 shadow-xl dark:border-white/10 dark:bg-neutral-900/95`}
      >
        {children}
      </div>
    </div>
  );
}
