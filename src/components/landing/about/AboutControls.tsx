"use client";

import { Moon, Sun } from "lucide-react";
import { useLanguage, type Language } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";

const OPTIONS: { value: Language; label: string }[] = [
  { value: "ka", label: "GE" },
  { value: "en", label: "EN" },
];

/**
 * The page's own controls, drawn as a paper-clip strip rather than the
 * site chrome's dark pills: on /about the header sits above a cream sheet,
 * so the theme and language switches belong to the sheet.
 */
export function AboutControls({ switchLabel }: { switchLabel: string }) {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center gap-2">
      <div
        role="group"
        aria-label={switchLabel}
        className="inline-flex items-center gap-0.5 rounded-full border-2 border-slate-300 bg-white/70 p-0.5 dark:border-white/15 dark:bg-white/[0.06]"
      >
        {OPTIONS.map((option) => {
          const active = language === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setLanguage(option.value)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                active
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to day mode" : "Switch to night mode"}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-300 bg-white/70 text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-400" strokeWidth={2} />
        ) : (
          <Moon className="h-4 w-4 text-sky-600" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
