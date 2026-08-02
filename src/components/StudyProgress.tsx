"use client";

import { ka } from "@/lib/i18n";

interface StudyProgressProps {
  current: number;
  total: number;
}

export function StudyProgress({ current, total }: StudyProgressProps) {
  const percent = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full max-w-xl space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {ka.study.cardOf} {current} {ka.study.of} {total}
        </span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {Math.round(percent)}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-violet-600 transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
