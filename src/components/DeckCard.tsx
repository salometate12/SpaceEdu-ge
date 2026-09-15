"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { getAssistantHrefForDeckCategory } from "@/lib/deck-assistant-links";
import { categoryLabels } from "@/lib/mockData";
import { ka } from "@/lib/i18n";
import type { Deck } from "@/lib/types";

interface DeckCardProps {
  deck: Deck;
  learnedCount: number;
}

export function DeckCard({ deck, learnedCount }: DeckCardProps) {
  const total = deck.cards.length;
  const progress = total > 0 ? Math.round((learnedCount / total) * 100) : 0;
  const assistantHref = getAssistantHrefForDeckCategory(deck.category);

  return (
    <div className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-pink-800/50">
      {assistantHref && (
        <Link
          href={assistantHref}
          aria-label={`${ka.nav.openAssistant} — ${categoryLabels[deck.category]}`}
          title={ka.nav.openAssistant}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-pink-200/60 bg-white/70 text-pink-600 opacity-80 shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:border-pink-300 hover:bg-pink-50 hover:opacity-100 hover:shadow-md hover:shadow-pink-500/20 dark:border-pink-800/50 dark:bg-zinc-900/80 dark:text-pink-400 dark:hover:bg-pink-950/60"
        >
          <Sparkles className="h-3.5 w-3.5" />
        </Link>
      )}

      <Link
        href={`/deck/${deck.id}`}
        className="flex flex-1 flex-col p-5"
      >
        <div className="mb-3 flex items-start justify-between gap-3 pr-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {categoryLabels[deck.category]}
          </span>
        </div>

        <h3 className="mb-1 text-lg font-semibold text-zinc-900 transition-colors group-hover:text-pink-600 dark:text-zinc-50 dark:group-hover:text-pink-400">
          {deck.title}
        </h3>
        <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {deck.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              {learnedCount} / {total} {ka.dashboard.cardsLearned}
            </span>
            <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
              {progress}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-pink-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-pink-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-pink-400">
          {ka.dashboard.startStudying}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    </div>
  );
}
