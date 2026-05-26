"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function ThemeToggle() {
  const { mode, toggleMode } = useTheme();
  const nextLabel = mode === "light" ? "Dark mode" : "Light mode";

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={`Switch to ${nextLabel}`}
      title={`Switch to ${nextLabel}`}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/50"
      style={{ color: "var(--color-text-secondary)" }}
    >
      {mode === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
