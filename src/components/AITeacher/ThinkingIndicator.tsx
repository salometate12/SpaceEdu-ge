"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Lightbulb } from "lucide-react";
import type { AiTeacherSpace } from "@/lib/ai-teacher-content";
import {
  addTipLearnedToday,
  nextWaitingCard,
  readTipsLearnedToday,
  type WaitingCard,
} from "@/lib/ai-teacher-waiting-cards";

const STAGES = ["კითხვას ვკითხულობ", "ახსნას ვამზადებ", "ვწერ პასუხს"] as const;
const STAGE_MS = 1200;
const CARD_AFTER_MS = 2500;
const CARD_ROTATE_MS = 6000;

interface ThinkingIndicatorProps {
  /** "full" adds the flip cards (the AI-teacher page); "compact" is the
   * stages only (the floating chat, where room is short). */
  variant?: "full" | "compact";
  space?: AiTeacherSpace;
}

/**
 * Shown in place of the answer until its first token arrives: three short
 * stages, then (on the page) a "did you know?" study-tip card to flip. The
 * parent unmounts it, with a fade, once text starts streaming.
 */
export function ThinkingIndicator({ variant = "compact", space = "student" }: ThinkingIndicatorProps) {
  const [stage, setStage] = useState(0);
  const [card, setCard] = useState<WaitingCard | null>(null);
  const [flipped, setFlipped] = useState(false);
  // Only ever rendered on the client, after a question was sent.
  const [learned, setLearned] = useState(() => readTipsLearnedToday());
  const [burst, setBurst] = useState(0);
  const lastTouch = useRef(0);
  const countedCards = useRef(new Set<string>());

  // Stages advance on a timer and hold on the last one.
  useEffect(() => {
    const timers = STAGES.slice(1).map((_, i) => window.setTimeout(() => setStage(i + 1), STAGE_MS * (i + 1)));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  // After a short wait, a tip card; a new one every ~6 s unless the
  // student just touched the current one.
  useEffect(() => {
    if (variant !== "full") return;
    let rotate: number | undefined;
    const show = window.setTimeout(() => {
      setCard(nextWaitingCard(space));
      rotate = window.setInterval(() => {
        if (Date.now() - lastTouch.current < CARD_ROTATE_MS) return;
        setFlipped(false);
        setCard(nextWaitingCard(space));
      }, CARD_ROTATE_MS);
    }, CARD_AFTER_MS);
    return () => {
      window.clearTimeout(show);
      if (rotate) window.clearInterval(rotate);
    };
  }, [variant, space]);

  const flip = () => {
    if (!card) return;
    lastTouch.current = Date.now();
    setFlipped((value) => !value);
    // A small reward the first time each card is turned over.
    if (!flipped && !countedCards.current.has(card.id)) {
      countedCards.current.add(card.id);
      setLearned(addTipLearnedToday());
      setBurst((n) => n + 1);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="AI ფიქრობს"
      className={`max-h-[140px] space-y-2.5 ${variant === "full" ? "w-[min(30rem,78vw)]" : ""}`}
    >
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {STAGES.map((label, index) => {
          const done = index < stage;
          const current = index === stage;
          return (
            <li
              key={label}
              className={`inline-flex items-center gap-1.5 transition-opacity duration-300 ${
                index > stage ? "opacity-0" : "opacity-100"
              } ${current ? "font-semibold text-[var(--accent-primary)]" : "text-[var(--text-muted)]"}`}
              aria-hidden={index > stage}
            >
              {done ? (
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              ) : (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-primary)] opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
                </span>
              )}
              {label}
            </li>
          );
        })}
      </ol>

      {variant === "full" && card ? (
        <div className="relative flex items-start gap-2">
          <button
            key={card.id}
            type="button"
            data-waiting-card
            onClick={flip}
            onPointerEnter={() => {
              lastTouch.current = Date.now();
            }}
            aria-pressed={flipped}
            aria-label={flipped ? `პასუხი: ${card.back}` : `იცოდი? ${card.front} — გადასაბრუნებლად დააჭირე`}
            className="ai-flip-card group relative h-[96px] min-w-0 flex-1 text-left focus:outline-none [perspective:900px]"
          >
            <span
              className={`ai-flip-inner absolute inset-0 rounded-2xl transition-transform duration-500 ease-out [transform-style:preserve-3d] motion-reduce:transition-none ${
                flipped ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              <span className="absolute inset-0 flex items-center gap-2.5 rounded-2xl border border-[var(--border)] bg-white/80 px-3.5 py-2.5 shadow-sm [backface-visibility:hidden] group-focus-visible:ring-2 group-focus-visible:ring-[var(--accent-primary)] dark:bg-white/[0.06]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                  <Lightbulb className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    იცოდი? · დააჭირე
                  </span>
                  <span className="line-clamp-2 text-sm font-medium text-[var(--text-primary)]">{card.front}</span>
                </span>
              </span>
              <span className="absolute inset-0 flex items-center rounded-2xl border border-[var(--accent-primary)]/30 bg-pink-50 px-3.5 py-2.5 [backface-visibility:hidden] [transform:rotateY(180deg)] group-focus-visible:ring-2 group-focus-visible:ring-[var(--accent-primary)] dark:bg-pink-500/10">
                <span className="line-clamp-4 text-[13px] leading-snug text-[var(--text-primary)]">{card.back}</span>
              </span>
            </span>
          </button>
          <span className="relative mt-1 shrink-0 whitespace-nowrap text-[11px] font-medium text-[var(--text-muted)]" title="დღეს ნასწავლი რჩევები">
            დღეს ნასწავლი: {learned}
            {burst > 0 ? (
              <span
                key={burst}
                aria-hidden
                className="ai-plus-one pointer-events-none absolute -top-4 right-0 text-xs font-bold text-[var(--accent-primary)]"
              >
                +1 ✨
              </span>
            ) : null}
          </span>
        </div>
      ) : null}
    </div>
  );
}
