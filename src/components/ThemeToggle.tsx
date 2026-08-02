"use client";

import { Moon, Sun } from "lucide-react";
import { ka } from "@/lib/i18n";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? ka.nav.themeDark : ka.nav.themeLight}
      aria-label={isDark ? ka.nav.themeDark : ka.nav.themeLight}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-all hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] ${showLabel ? "px-3 py-1.5" : "h-9 w-9"} ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 shrink-0 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 shrink-0 text-violet-600" />
      )}
      {showLabel ? (
        <span className="text-xs font-medium">
          {isDark ? "დღე" : "ღამე"}
        </span>
      ) : null}
    </button>
  );
}
