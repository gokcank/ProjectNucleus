import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { logWarn } from "../services/logger-service";
import { getSetting, setSetting } from "../services/settings-service";
import { ThemeContext, type Theme } from "./theme-context";

const SETTING_KEY = "theme";
const COLOR_SCHEME_CHANGED_EVENT = "color-scheme-changed";

type ColorSchemeStatus = "dark" | "light" | "no-preference";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [systemIsDark, setSystemIsDark] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSetting<Theme>(SETTING_KEY, "system")
      .then((stored) => {
        if (!cancelled && isTheme(stored)) setThemeState(stored);
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
    setSetting(SETTING_KEY, next).catch((err: unknown) => {
      logWarn(`Failed to persist theme setting: ${String(err)}`);
    });
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
