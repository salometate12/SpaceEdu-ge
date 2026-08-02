"use client";

import Link from "next/link";
import { Home, RotateCcw, Trophy } from "lucide-react";
import { ka } from "@/lib/i18n";
import type { StudySessionResult } from "@/lib/types";

interface SummaryScreenProps {
  deckTitle: string;
  result: StudySessionResult;
  onRestart: () => void;
}

export function SummaryScreen({
  deckTitle,
  result,
  onRestart,
}: SummaryScreenProps) {
  const masteryPercent =
    result.total > 0 ? Math.round((result.known / result.total) * 100) : 0;

  return (
    <div className="flex w-full max-w-md flex-col items-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
        <Trophy className="h-8 w-8" />
      </div>

      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {ka.summary.complete}
      </h2>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">{deckTitle}</p>

      <div className="mt-8 w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
          {result.known}/{result.total}
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {ka.summary.mastered}
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-violet-600 transition-all duration-700"
            style={{ width: `${masteryPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          {result.unknown} {ka.summary.forReview}
        </p>
      </div>

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRestart}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-violet-700 active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          {ka.summary.restart}
        </button>
        <Link
          href="/"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <Home className="h-4 w-4" />
          {ka.summary.backToDecks}
        </Link>
      </div>
    </div>
  );
}
