"use client";

import { Check, X } from "lucide-react";
import { ka } from "@/lib/i18n";

interface StudyControlsProps {
  onDontKnow: () => void;
  onKnow: () => void;
  disabled?: boolean;
}

export function StudyControls({
  onDontKnow,
  onKnow,
  disabled,
}: StudyControlsProps) {
  return (
    <div className="flex w-full max-w-xl items-center justify-center gap-4 sm:gap-8">
      <button
        type="button"
        onClick={onDontKnow}
        disabled={disabled}
        aria-label={ka.study.dontKnow}
        className="group flex flex-col items-center gap-2 disabled:opacity-50"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-200 bg-red-50 text-red-600 shadow-sm transition-all hover:scale-105 hover:border-red-300 hover:bg-red-100 active:scale-95 disabled:hover:scale-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50">
          <X className="h-6 w-6" />
        </span>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {ka.study.dontKnow}
          <span className="hidden sm:inline"> (←)</span>
        </span>
      </button>

      <button
        type="button"
        onClick={onKnow}
        disabled={disabled}
        aria-label={ka.study.knowIt}
        className="group flex flex-col items-center gap-2 disabled:opacity-50"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm transition-all hover:scale-105 hover:border-emerald-300 hover:bg-emerald-100 active:scale-95 disabled:hover:scale-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50">
          <Check className="h-6 w-6" />
        </span>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {ka.study.knowIt}
          <span className="hidden sm:inline"> (→)</span>
        </span>
      </button>
    </div>
  );
}
