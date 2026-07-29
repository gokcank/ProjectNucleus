import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { logWarn } from "../services/logger-service";
import { PanelBringToFrontContext } from "./panel-context";

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

  const cancelClose = useCallback(() => {
    if (hideTimer.current !== undefined) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = undefined;
    }
    setExiting(false);
  }, []);

  // Restarting the enter animation in place rather than remounting matters --
  // remounting would wipe every widget's state, resetting a running timer or
  // a half-typed note each time the panel is summoned.
  const restartEnterAnimation = useCallback(() => {
    const element = surface.current;
    if (!element) return;
    element.style.animation = "none";
    element.getBoundingClientRect(); // force a reflow so it can start over
    element.style.animation = "";
  }, []);

  // Exposed to widgets via context (see use-bring-panel-to-front.ts). Resets
  // the panel's own closing state immediately, independent of whether the OS
  // actually grants focus back to the window.
  const bringToFront = useCallback(() => {
    cancelClose();
    restartEnterAnimation();

    let appWindow: ReturnType<typeof getCurrentWindow>;
    try {
      appWindow = getCurrentWindow();
    } catch {
      return; // No Tauri runtime available (e.g. browser preview).
    }
    appWindow
      .show()
      .then(() => appWindow.setFocus())
      .catch((err: unknown) => {
        logWarn(`Failed to bring the panel to front: ${String(err)}`);
      });
  }, [cancelClose, restartEnterAnimation]);

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
        appWindow
          .hide()
          .catch((err: unknown) => {
            logWarn(`Failed to hide panel: ${String(err)}`);
          })
          // Clear the closing state once the window is out of sight, so the
          // panel is ready to be shown again. Leaving it set would hold the
          // exit animation at its final frame (fully transparent), and the
          // next native show() -- the global shortcut or the tray menu, which
          // both go straight to the window without touching this component --
          // would reveal a window whose content is still invisible. Resetting
          // only after hide() resolves keeps the closing animation from
          // flashing back in on its last frame.
          .finally(() => setExiting(false));
      }, EXIT_ANIMATION_MS);
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
          cancelClose();
          restartEnterAnimation();
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
  }, [cancelClose, restartEnterAnimation]);

  return (
    <div className="h-screen w-screen p-6">
      {/* The surface is fully opaque on purpose. At 95% the desktop wallpaper
          bled through by 5%, so this surface drifted with whatever sat behind
          it instead of staying flat; every card background and border is a
          low-opacity layer over it, so each one carried a different amount of
          that drift, and WebKit could not subpixel-antialias text on top of a
          translucent layer, leaving color fringes around glyphs. Per ADR-009,
          glass degrades to a solid surface when it costs readability. */}
      <div
        ref={surface}
        className={`${exiting ? "panel-exit" : "panel-enter"} h-full w-full overflow-hidden rounded-3xl border border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900`}
      >
        <PanelBringToFrontContext.Provider value={bringToFront}>
          {children}
        </PanelBringToFrontContext.Provider>
      </div>
    </div>
  );
}
