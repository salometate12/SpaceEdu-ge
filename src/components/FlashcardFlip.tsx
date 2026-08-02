"use client";

import { RotateCcw } from "lucide-react";
import { ka } from "@/lib/i18n";
import type { Flashcard } from "@/lib/types";

interface FlashcardFlipProps {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlashcardFlip({ card, isFlipped, onFlip }: FlashcardFlipProps) {
  return (
    <div className="w-full max-w-xl perspective-[1200px]">
      <button
        type="button"
        onClick={onFlip}
        aria-label={isFlipped ? ka.study.answer : ka.study.question}
        className="group relative h-72 w-full cursor-pointer sm:h-80"
        style={{ perspective: "1200px" }}
      >
        <div
          className="relative h-full w-full transition-transform duration-500 ease-in-out"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              {ka.study.question}
            </span>
            <p className="text-center text-xl font-medium leading-relaxed text-zinc-900 sm:text-2xl dark:text-zinc-50">
              {card.question}
            </p>
            <span className="mt-6 flex items-center gap-1.5 text-xs text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
              <RotateCcw className="h-3 w-3" />
              {ka.study.flipHint}
            </span>
          </div>

          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 p-8 shadow-lg dark:border-violet-800/50 dark:bg-violet-950/30"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <span className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              {ka.study.answer}
            </span>
            <p className="text-center text-base leading-relaxed text-zinc-700 sm:text-lg dark:text-zinc-200">
              {card.answer}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
