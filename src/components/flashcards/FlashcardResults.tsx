"use client";

import { RotateCcw, Sparkles, Trophy } from "lucide-react";
import { useStreak } from "@/hooks/useStreak";
import { counts, type FlashcardSession } from "@/lib/flashcard-session";
import type { Deck } from "@/lib/types";

function durationLabel(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  if (minutes === 0) return `${seconds} წმ`;
  return `${minutes} წთ ${seconds % 60} წმ`;
}

/**
 * The end of a deck: how many cards are known, how many to go over again,
 * how long it took, and the cards still unknown, with their answers.
 */
export function FlashcardResults({
  deck,
  session,
  onRepeat,
  onRestart,
  onQuiz,
}: {
  deck: Deck;
  session: FlashcardSession;
  onRepeat: () => void;
  onRestart: () => void;
  onQuiz: () => void;
}) {
  const streak = useStreak();
  const { known, unknown } = counts(session, deck.cards.map((card) => card.id));
  const toRepeat = deck.cards.filter((card) => session.status[card.id] === "unknown");
  const allKnown = toRepeat.length === 0;
  const tiles = [
    { label: "ვიცი", value: String(known), className: "bg-[#f0fdf4] text-[#15803d] dark:bg-[rgba(74,222,128,0.1)] dark:text-[#86efac]" },
    { label: "გასამეორებელი", value: String(unknown), className: "bg-[#fff1f2] text-[#be123c] dark:bg-[rgba(244,63,94,0.1)] dark:text-[#fda4af]" },
    { label: "დრო", value: durationLabel((session.finishedAt ?? session.updatedAt) - session.startedAt), className: "bg-[var(--gen-soft)] text-[var(--gen-title)]" },
  ];

  return (
    <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
      <section className="gen-card flex flex-col gap-6 p-6 sm:p-8">
        <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#fefce8] text-[#ca8a04] dark:bg-[rgba(250,204,21,0.12)] dark:text-[#fde68a]" aria-hidden>
          <Trophy className="h-7 w-7" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-[26px] font-bold leading-tight text-[var(--gen-title)] sm:text-[30px]">
            {allKnown ? "ყველა ბარათი იცი!" : "დასტა დასრულდა!"}
          </h2>
          <p className="mt-2 text-[16px] text-[var(--gen-text)]">
            <span className="bg-[linear-gradient(transparent_60%,#bbf7d0_60%)] px-0.5 font-semibold text-[var(--gen-title)] dark:bg-[linear-gradient(transparent_60%,rgba(74,222,128,0.35)_60%)]">
              {known} ბარათი
            </span>{" "}
            უკვე იცი
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {tiles.map((tile) => (
            <div key={tile.label} className={`rounded-[18px] p-3.5 sm:p-4 ${tile.className}`}>
              <p className="text-[12.5px] font-semibold opacity-80">{tile.label}</p>
              <p className="mt-1 text-[20px] font-bold leading-none sm:text-[24px]">{tile.value}</p>
            </div>
          ))}
        </div>
        {streak.ready && streak.current > 0 ? (
          <p className="text-[14px] text-[var(--gen-muted)]">
            სტრიქი: <span className="font-semibold text-[var(--gen-title)]">{streak.current} დღე</span>
          </p>
        ) : null}
        <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {allKnown ? (
            <button type="button" onClick={onRestart} className="gen-primary h-12 whitespace-nowrap px-6 text-[15px]">
              <RotateCcw className="h-4 w-4" aria-hidden />
              თავიდან გავლა
            </button>
          ) : (
            <button type="button" onClick={onRepeat} className="gen-primary h-12 whitespace-nowrap px-6 text-[15px]">
              <RotateCcw className="h-4 w-4" aria-hidden />
              გაიმეორე {toRepeat.length} ბარათი
            </button>
          )}
          <button type="button" onClick={onQuiz} className="gen-secondary h-12 whitespace-nowrap px-6 text-[15px]">
            <Sparkles className="h-4 w-4" aria-hidden />
            ქვიზად გადაქცევა
          </button>
        </div>
      </section>

      <section className="gen-card flex flex-col p-6 sm:p-8" aria-label="გასამეორებელი">
        <h2 className="text-[18px] font-bold text-[var(--gen-title)]">გასამეორებელი</h2>
        {allKnown ? (
          <p className="mt-3 text-[15px] text-[var(--gen-muted)]">გასამეორებელი არაფერია. შეგიძლია დასტა თავიდან გაიარო ან ქვიზით შეამოწმო.</p>
        ) : (
          <ul className="mt-4 flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
            {toRepeat.map((card) => (
              <li key={card.id} className="rounded-[16px] border border-[var(--gen-border)] p-4">
                <p className="text-[15px] font-semibold text-[var(--gen-title)]">{card.question}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--gen-muted)]">{card.answer}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
