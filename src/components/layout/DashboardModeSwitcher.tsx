"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEFAULT_ASSISTANT_HREF } from "@/lib/deck-assistant-links";
import { ka } from "@/lib/i18n";

interface DashboardModeSwitcherProps {
  className?: string;
}

export function DashboardModeSwitcher({ className = "" }: DashboardModeSwitcherProps) {
  const pathname = usePathname();
  const isAssistants =
    pathname === "/" ? false : pathname.endsWith("-assistant");

  const segmentBase =
    "flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition-all lg:gap-1.5 lg:px-3 lg:text-sm";

  return (
    <div
      className={`flex rounded-xl bg-zinc-100/90 p-1 ring-1 ring-zinc-200/60 dark:bg-zinc-800/90 dark:ring-zinc-700/60 ${className}`}
      role="tablist"
      aria-label={ka.nav.modeSwitcherLabel}
    >
      <Link
        href="/"
        role="tab"
        aria-selected={!isAssistants}
        className={`${segmentBase} ${
          !isAssistants
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        {ka.nav.modeFlashcards}
      </Link>
      <Link
        href={DEFAULT_ASSISTANT_HREF}
        role="tab"
        aria-selected={isAssistants}
        className={`${segmentBase} ${
          isAssistants
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        {ka.nav.modeAssistants}
      </Link>
    </div>
  );
}
