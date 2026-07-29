import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { logWarn } from "../services/logger-service";
import { getSetting, setSetting } from "../services/settings-service";
import { ThemeContext, type Theme } from "./theme-context";

const SETTING_KEY = "theme";
const COLOR_SCHEME_CHANGED_EVENT = "color-scheme-changed";
const THEME_MIRROR_KEY = "nucleus:theme";

type ColorSchemeStatus = "dark" | "light" | "no-preference";

declare global {
  interface Window {
    /** Injected by the Rust side before any page script runs; see appearance.rs. */
    __NUCLEUS_SYSTEM_DARK__?: boolean;
  }
}

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

/**
 * The real system setting, read from the XDG Settings portal before the window
 * was created and injected into the page (see `startup_init_script` in
 * appearance.rs). Available synchronously on the very first render, so the
 * first frame is already correct instead of guessing and correcting itself.
 *
 * Falls back to WebKitGTK's own media query only when the injected value is
 * missing (portal unavailable or slow, or running outside Tauri) -- it does not
 * reliably reflect GNOME's actual setting, hence the portal in the first place.
 */
function initialSystemIsDark(): boolean {
  if (typeof window.__NUCLEUS_SYSTEM_DARK__ === "boolean") {
    return window.__NUCLEUS_SYSTEM_DARK__;
  }
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

/**
 * The stored preference lives in the Tauri store, which can only be read
 * asynchronously, so it is mirrored into localStorage as well. Without the
 * mirror an explicit "light" choice on a dark system would render dark for the
 * first frames before the store answered.
 */
function initialTheme(): Theme {
  try {
    const mirrored: unknown = window.localStorage.getItem(THEME_MIRROR_KEY);
    if (isTheme(mirrored)) return mirrored;
  } catch {
    // Storage unavailable -- "system" is the right default anyway.
  }
  return "system";
}

function mirrorTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_MIRROR_KEY, theme);
  } catch {
    // Storage unavailable; the Tauri store remains the source of truth.
  }
}

// Applied at module scope, before React renders anything, so no frame is ever
// painted with the wrong theme.
const INITIAL_THEME = initialTheme();
const INITIAL_SYSTEM_IS_DARK = initialSystemIsDark();
applyTheme(INITIAL_THEME === "system" ? INITIAL_SYSTEM_IS_DARK : INITIAL_THEME === "dark");

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(INITIAL_THEME);
  const [systemIsDark, setSystemIsDark] = useState(INITIAL_SYSTEM_IS_DARK);

  useEffect(() => {
    let cancelled = false;
    getSetting<Theme>(SETTING_KEY, "system")
      .then((stored) => {
        if (!isTheme(stored)) return;
        mirrorTheme(stored);
        if (!cancelled) setThemeState(stored);
      })
      .catch((err: unknown) => {
        logWarn(`Failed to load theme setting, falling back to system: ${String(err)}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The system color scheme comes from the XDG Settings portal
  // (org.freedesktop.portal.Settings, read via the Rust side) rather than the
  // WebView's own `prefers-color-scheme` guess: WebKitGTK does not reliably
  // read GNOME's actual setting, nor update it live when the user changes it
  // while the app is running. The portal's change signal does both.
  useEffect(() => {
    let cancelled = false;

    invoke<ColorSchemeStatus>("color_scheme")
      .then((status) => {
        if (!cancelled) setSystemIsDark(status === "dark");
      })
      .catch((err: unknown) => {
        logWarn(`Could not read the system color scheme: ${String(err)}`);
      });

    let unlisten: (() => void) | undefined;
    listen<ColorSchemeStatus>(COLOR_SCHEME_CHANGED_EVENT, (event) => {
      setSystemIsDark(event.payload === "dark");
    })
      .then((fn) => {
        // The effect may already have torn down by the time this resolves
        // (React StrictMode's dev-only double-invoke does this on every
        // mount): dispose immediately instead of leaking the listener.
        if (cancelled) {
          fn();
        } else {
          unlisten = fn;
        }
      })
      .catch((err: unknown) => {
        logWarn(`Could not watch for system color scheme changes: ${String(err)}`);
      });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    applyTheme(theme === "system" ? systemIsDark : theme === "dark");
  }, [theme, systemIsDark]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    mirrorTheme(next);
    setSetting(SETTING_KEY, next).catch((err: unknown) => {
      logWarn(`Failed to persist theme setting: ${String(err)}`);
    });
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
