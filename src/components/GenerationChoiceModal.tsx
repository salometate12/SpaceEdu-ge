"use client";

import { FileText, Lightbulb, Loader2, X } from "lucide-react";
import { ka } from "@/lib/i18n";
import type { FlashcardDraft } from "@/lib/ai/parse-flashcards-json";

export type GenerationType = "flashcards" | "summary";

interface GenerationChoiceModalProps {
  isOpen: boolean;
  isLoading: boolean;
  generationType: GenerationType | null;
  error: string | null;
  streamPreview?: string;
  streamingCards?: FlashcardDraft[];
  onSelect: (type: GenerationType) => void;
  onClose: () => void;
}

function FlashcardStreamSkeleton({ cards }: { cards: FlashcardDraft[] }) {
  return (
    <div className="assistant-history-scroll mt-4 max-h-56 space-y-2 overflow-y-auto">
      {cards.map((card) => (
        <div
          key={card.question}
          className="rounded-xl border border-violet-500/15 bg-[#121214]/40 p-3 backdrop-blur-sm"
        >
          <p className="text-xs font-medium text-violet-200">{card.question}</p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
            {card.answer}
          </p>
        </div>
      ))}
    </div>
  );
}

export function GenerationChoiceModal({
  isOpen,
  isLoading,
  generationType,
  error,
  streamPreview = "",
  streamingCards = [],
  onSelect,
  onClose,
}: GenerationChoiceModalProps) {
  if (!isOpen) return null;

  const loadingMessage =
    generationType === "summary"
      ? ka.generator.modal.loadingSummary
      : ka.generator.modal.loadingFlashcards;

  const showCardStream = generationType === "flashcards" && streamingCards.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="generation-modal-title"
    >
      <button
        type="button"
        aria-label={ka.generator.modal.close}
        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
        onClick={isLoading ? undefined : onClose}
        disabled={isLoading}
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 sm:p-8">
        {!isLoading && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            aria-label={ka.generator.modal.close}
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {isLoading ? (
          <div className="flex w-full flex-col py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-violet-600 stroke-[1.5]" />
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {loadingMessage}
              </p>
            </div>

            {showCardStream ? (
              <>
                <p className="mt-3 text-xs text-violet-400">
                  {ka.generator.modal.cardsLoading} ({streamingCards.length})
                </p>
                <FlashcardStreamSkeleton cards={streamingCards} />
              </>
            ) : streamPreview ? (
              <div className="assistant-history-scroll mt-4 max-h-48 overflow-y-auto rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3 text-left dark:border-zinc-700 dark:bg-zinc-950/40">
                <p className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {streamPreview}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                {ka.generator.modal.loadingHint}
              </p>
            )}
          </div>
        ) : (
          <>
            <h2
              id="generation-modal-title"
              className="pr-8 text-center text-xl font-bold text-zinc-900 dark:text-zinc-50"
            >
              {ka.generator.modal.title}
            </h2>
            <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {ka.generator.modal.subtitle}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onSelect("flashcards")}
                className="group flex flex-col items-start rounded-xl border-2 border-zinc-200 bg-zinc-50 p-4 text-left transition-all hover:border-violet-400 hover:bg-violet-50 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-violet-500 dark:hover:bg-violet-950/30"
              >
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  <Lightbulb className="h-5 w-5" />
                </span>
                <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {ka.generator.modal.flashcardsTitle}
                </span>
                <span className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {ka.generator.modal.flashcardsDesc}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelect("summary")}
                className="group flex flex-col items-start rounded-xl border-2 border-zinc-200 bg-zinc-50 p-4 text-left transition-all hover:border-violet-400 hover:bg-violet-50 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-violet-500 dark:hover:bg-violet-950/30"
              >
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {ka.generator.modal.summaryTitle}
                </span>
                <span className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {ka.generator.modal.summaryDesc}
                </span>
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
