"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const STORAGE_KEY = "theme_mode";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialMode(): ThemeMode {
  if (typeof document === "undefined") return "light";
  const current = document.documentElement.getAttribute("data-theme");
  return current === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitialMode);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    document.documentElement.setAttribute("data-theme", nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
  };

  const toggleMode = () => {
    setMode(mode === "light" ? "dark" : "light");
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    return {
      mode: "light",
      setMode: () => {},
      toggleMode: () => {},
    };
  }
  return value;
}

export function themeBootScript(): string {
  return `
    (function() {
      try {
        var mode = localStorage.getItem("${STORAGE_KEY}");
        var safeMode = mode === "dark" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", safeMode);
      } catch (error) {
        document.documentElement.setAttribute("data-theme", "light");
      }
    })();
  `;
}
