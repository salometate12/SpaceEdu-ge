"use client";

import Link from "next/link";
import { Settings, Sparkles, User } from "lucide-react";
import { ka } from "@/lib/i18n";
import type { SmartSpace } from "@/lib/smart-space";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  activeSpace?: SmartSpace;
  onSpaceChange?: (space: SmartSpace) => void;
}

export function Navbar({ activeSpace, onSpaceChange }: NavbarProps = {}) {
  const showSpaceSwitcher = Boolean(activeSpace && onSpaceChange);

  return (
    <header className="shrink-0 border-b border-zinc-200/60 bg-white/80 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/80">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/select-space"
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="bg-gradient-to-r from-violet-500 to-indigo-600 bg-clip-text text-lg font-bold tracking-tight text-transparent">
            SpaceEdu
          </span>
        </Link>

        {showSpaceSwitcher && (
          <div className="hidden flex-1 items-center justify-center md:flex">
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 backdrop-blur-md">
              <button
                type="button"
                onClick={() => onSpaceChange?.("school")}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                  activeSpace === "school"
                    ? "bg-purple-600/90 text-white shadow-md shadow-purple-500/10"
                    : "text-white/50 hover:bg-white/[0.05] hover:text-white/90"
                }`}
              >
                🎒 სკოლა
              </button>
              <button
                type="button"
                onClick={() => onSpaceChange?.("exam")}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                  activeSpace === "exam"
                    ? "bg-purple-600/90 text-white shadow-md shadow-purple-500/10"
                    : "text-white/50 hover:bg-white/[0.05] hover:text-white/90"
                }`}
              >
                🧠 გამოცდები
              </button>
              <button
                type="button"
                onClick={() => onSpaceChange?.("university")}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                  activeSpace === "university"
                    ? "bg-purple-600/90 text-white shadow-md shadow-purple-500/10"
                    : "text-white/50 hover:bg-white/[0.05] hover:text-white/90"
                }`}
              >
                🎓 უნივერსიტეტი
              </button>
            </div>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <Link
            href="/profile"
            aria-label={ka.nav.profile}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/80 bg-white text-zinc-600 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          >
            <User className="h-4 w-4" />
          </Link>
          <button
            type="button"
            aria-label={ka.nav.settings}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-zinc-200/80 bg-white text-zinc-600 transition-all hover:bg-zinc-50 sm:flex dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
