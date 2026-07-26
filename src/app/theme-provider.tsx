import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getSetting, setSetting } from "../services/settings-service";
import { ThemeContext, type Theme } from "./theme-context";

const SETTING_KEY = "theme";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    let cancelled = false;
    getSetting<Theme>(SETTING_KEY, "system")
      .then((stored) => {
        if (!cancelled && isTheme(stored)) setThemeState(stored);
      })
      .catch(() => {
        // No Tauri runtime available (e.g. browser preview) — keep the default.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    applyTheme(theme);

    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    setSetting(SETTING_KEY, next).catch(() => {
      // No Tauri runtime available (e.g. browser preview) — theme still applies for this session.
    });
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
