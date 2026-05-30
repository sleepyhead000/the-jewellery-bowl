"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const STORAGE_KEY = "theme_mode";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialMode(): ThemeMode {
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitialMode);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    document.documentElement.setAttribute("data-theme", nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "light" ? "dark" : "light");
  }, [mode, setMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode, setMode, toggleMode]);
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
