"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, List, RotateCw, Shuffle, Sparkles, X } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { logActivity } from "@/lib/activity-log";
import { recordDailyActivity } from "@/lib/daily-streak";
import { dashboardHrefForSpace } from "@/lib/dashboard-routes";
import {
  answer,
  counts,
  fitsDeck,
  loadSession,
  repeatUnknown,
  saveSession,
  shuffleRest,
  startSession,
  type FlashcardSession,
} from "@/lib/flashcard-session";
import { markCardLearned } from "@/lib/progress";
import { readSpaceeduSpace } from "@/lib/space-back-navigation";
import { deckAsQuizText } from "@/lib/library/materials";
import { handOff } from "@/lib/tool-handoff";
import type { Deck, Flashcard } from "@/lib/types";
import { FlashcardResults } from "./FlashcardResults";
import { CardListSheet } from "./CardListSheet";
import "@/components/generate/generate.css";

/** Beyond this many cards the progress bar is one continuous bar instead of a segment per card. */
const SEGMENTS_UP_TO = 30;
/** How far a swipe must go before it counts as an answer. */
const SWIPE_THRESHOLD = 90;

function ProgressBar({ deck, session }: { deck: Deck; session: FlashcardSession }) {
  const currentId = session.finishedAt ? null : session.order[session.index];
  if (deck.cards.length > SEGMENTS_UP_TO) {
    const { known, unknown } = counts(session, deck.cards.map((card) => card.id));
    const total = deck.cards.length;
    return (
      <div className="flex h-2 overflow-hidden rounded-full bg-[var(--gen-border)]" aria-hidden>
        <span className="h-full bg-[#4ade80]" style={{ width: `${(known / total) * 100}%` }} />
        <span className="h-full bg-[#fda4af]" style={{ width: `${(unknown / total) * 100}%` }} />
      </div>
    );
  }
  return (
    <div className="flex gap-1" aria-hidden>
      {deck.cards.map((card) => {
        const status = session.status[card.id];
        const color =
          card.id === currentId
            ? "bg-[var(--gen-strong)]"
            : status === "known"
              ? "bg-[#4ade80]"
              : status === "unknown"
                ? "bg-[#fda4af]"
                : "bg-[var(--gen-border)]";
        return <span key={card.id} className={`h-2 flex-1 rounded-full ${color}`} />;
      })}
    </div>
  );
}

function FlipCard({
  card,
  flipped,
  onFlip,
  onSwipe,
}: {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
  onSwipe: (known: boolean) => void;
}) {
  const [drag, setDrag] = useState(0);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const long = card.question.length > 110;

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    start.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    document.documentElement.style.overscrollBehavior = "none";
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!start.current || start.current.id !== event.pointerId) return;
    setDrag(event.clientX - start.current.x);
  };
  const end = (event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const begin = start.current;
    start.current = null;
    document.documentElement.style.overscrollBehavior = "";
    setDrag(0);
    if (!begin || cancelled) return;
    const dx = event.clientX - begin.x;
    const dy = event.clientY - begin.y;
    if (Math.abs(dx) >= SWIPE_THRESHOLD) onSwipe(dx > 0);
    // A tap, not a drag: turn the card over.
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) onFlip();
  };

  const tilt = Math.max(-8, Math.min(8, drag / 14));
  const verdict = Math.abs(drag) > 30 ? (drag > 0 ? "known" : "unknown") : null;

  return (
    <div className="relative mx-auto w-full max-w-[720px]">
      <span className="flip-layer bottom-[-16px] h-full w-[88%] opacity-60" aria-hidden />
      <span className="flip-layer bottom-[-8px] h-full w-[94%]" aria-hidden />
      <div
        role="button"
        tabIndex={0}
        aria-label={flipped ? "პასუხი. დააჭირე კითხვის სანახავად" : "კითხვა. დააჭირე პასუხის სანახავად"}
        onKeyDown={(event) => {
          if (event.key === "Enter") onFlip();
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => end(event)}
        onPointerCancel={(event) => end(event, true)}
        className="flip-scene gen-focus relative h-[min(58dvh,460px)] cursor-pointer touch-pan-y select-none rounded-[28px] md:h-[380px]"
        style={{ transform: drag ? `translateX(${drag}px) rotate(${tilt}deg)` : undefined, transition: drag ? "none" : "transform 200ms ease" }}
      >
        <div className="flip-inner" data-flipped={flipped}>
          <div className="flip-face flex flex-col p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <span className="font-bold text-[#db2777] dark:text-[#f472b6]">კითხვა</span>
              <span className="inline-flex items-center gap-1.5 text-[var(--gen-faint)]">
                <RotateCw className="h-3.5 w-3.5" aria-hidden />
                გადასაბრუნებლად დააჭირე
              </span>
            </div>
            <p className={`m-auto max-w-[560px] text-center font-bold leading-snug text-[var(--gen-title)] [overflow-wrap:anywhere] ${long ? "text-[19px] sm:text-[22px]" : "text-[23px] sm:text-[30px]"}`}>
              {card.question}
            </p>
            {card.hint ? <p className="text-center text-[13px] text-[var(--gen-muted)]">მინიშნება: {card.hint}</p> : null}
          </div>
          <div className="flip-face flip-back flex flex-col p-6 sm:p-8">
            <span className="text-[13px] font-bold text-[#854d0e] dark:text-[#fde68a]">პასუხი</span>
            <p className="m-auto max-w-[580px] overflow-y-auto text-center text-[17px] leading-relaxed text-[var(--gen-title)] [overflow-wrap:anywhere] sm:text-[20px]">
              {card.answer}
            </p>
          </div>
        </div>
        {verdict ? (
          <span
            className={`absolute top-4 z-10 rounded-full px-3 py-1.5 text-[13px] font-bold ${
              verdict === "known" ? "right-4 bg-[#f0fdf4] text-[#15803d]" : "left-4 bg-[#fff1f2] text-[#be123c]"
            }`}
          >
            {verdict === "known" ? "ვიცი" : "არ ვიცი"}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Studying a deck: one card at a time, flipped with a tap, Space or Enter;
 * answered with the two buttons, ← / →, or a swipe on a phone. The first
 * round goes through every card, then the „არ ვიცი“ ones come back once.
 * Where the student is stays on the account.
 */
export function FlashcardStudy({ deck }: { deck: Deck }) {
  const router = useRouter();
  const cardIds = useMemo(() => deck.cards.map((card) => card.id), [deck.cards]);
  const [session, setSession] = useState<FlashcardSession | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [dashboardHref, setDashboardHref] = useState("/dashboard-student");

  useEffect(() => {
    const saved = loadSession(deck.id);
    const next = saved && fitsDeck(saved, cardIds) ? saved : startSession(deck.id, cardIds);
    void Promise.resolve().then(() => {
      setSession(next);
      setDashboardHref(dashboardHrefForSpace(readSpaceeduSpace()));
    });
  }, [deck.id, cardIds]);

  const update = useCallback((next: FlashcardSession) => {
    setSession(next);
    saveSession(next);
  }, []);

  const respond = useCallback(
    (known: boolean) => {
      if (!session || session.finishedAt) return;
      const cardId = session.order[session.index];
      if (known && cardId) markCardLearned(deck.id, cardId);
      const next = answer(session, known);
      setFlipped(false);
      update(next);
      if (next.finishedAt) {
        const result = counts(next, cardIds);
        recordDailyActivity();
        logActivity({
          type: "flashcards_completed",
          tool: "flashcards",
          value: Math.round((result.known / Math.max(1, cardIds.length)) * 100),
          meta: { cards: cardIds.length, unknown: result.unknown },
        });
      }
    },
    [session, deck.id, cardIds, update],
  );

  const flip = useCallback(() => setFlipped((value) => !value), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!session || session.finishedAt || listOpen) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;
      if (event.code === "Space") {
        event.preventDefault();
        flip();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        respond(false);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        respond(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [session, listOpen, flip, respond]);

  const toQuiz = () => {
    handOff("quiz", { title: deck.title, text: deckAsQuizText(deck) });
    router.push("/quiz");
  };

  if (!session) return <div className="gen min-h-dvh" aria-busy />;

  const { known, unknown } = counts(session, cardIds);
  const card = deck.cards.find((item) => item.id === session.order[session.index]);
  const subtitle = [`${deck.cards.length} ბარათი`, deck.source].filter(Boolean).join(" · ");

  return (
    <div className="gen under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col px-4 pb-16 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-10">
        <header className="flex items-start gap-3 sm:gap-4">
          <BackButton fallbackHref={dashboardHref} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[20px] font-bold leading-tight text-[var(--gen-title)] sm:text-[26px]">{deck.title}</h1>
            <p className="mt-1 truncate text-[14px] text-[var(--gen-muted)]">{subtitle}</p>
          </div>
          {!session.finishedAt ? (
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => update(shuffleRest(session))} aria-label="არევა" className="gen-secondary h-10 w-10 text-[14px] sm:w-auto sm:px-4">
                <Shuffle className="h-4 w-4" aria-hidden />
                <span className="max-sm:hidden">არევა</span>
              </button>
              <button type="button" onClick={() => setListOpen(true)} aria-label="ბარათების სია" className="gen-secondary h-10 w-10 text-[14px] sm:w-auto sm:px-4">
                <List className="h-4 w-4" aria-hidden />
                <span className="max-sm:hidden">სია</span>
              </button>
              <button type="button" onClick={toQuiz} className="gen-secondary h-10 px-4 text-[14px] max-md:!hidden">
                <Sparkles className="h-4 w-4" aria-hidden />
                ქვიზად გადაქცევა
              </button>
            </div>
          ) : null}
        </header>

        {session.finishedAt ? (
          <FlashcardResults
            deck={deck}
            session={session}
            onRepeat={() => {
              setFlipped(false);
              update(repeatUnknown(session));
            }}
            onRestart={() => {
              setFlipped(false);
              update(startSession(deck.id, cardIds));
            }}
            onQuiz={toQuiz}
          />
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-2.5">
              <ProgressBar deck={deck} session={session} />
              <div className="flex items-center gap-4 text-[13.5px] font-semibold">
                <span className="text-[#15803d] dark:text-[#86efac]">ვიცი {known}</span>
                <span className="text-[#be123c] dark:text-[#fda4af]">გასამეორებელი {unknown}</span>
                <span className="ml-auto text-[var(--gen-muted)]">
                  {session.round > 1 ? "მეორე რაუნდი · " : ""}ბარათი {Math.min(session.index + 1, session.order.length)} / {session.order.length}
                </span>
              </div>
            </div>

            <div className="mt-8 pb-4">
              {card ? <FlipCard key={card.id} card={card} flipped={flipped} onFlip={flip} onSwipe={respond} /> : null}
            </div>

            <p className="mt-4 text-center text-[13px] text-[var(--gen-muted)] md:hidden">← გადაწიე, თუ არ იცი · თუ იცი →</p>
            <div className="mt-3 flex justify-center gap-3 md:mt-8 md:gap-4">
              <button
                type="button"
                onClick={() => respond(false)}
                className="gen-focus inline-flex h-[54px] flex-1 items-center justify-center gap-2 rounded-full border border-[#fecdd3] bg-[#fff1f2] text-[16px] font-bold text-[#be123c] md:h-[58px] md:w-[240px] md:flex-none dark:border-transparent dark:bg-[rgba(244,63,94,0.12)] dark:text-[#fda4af]"
              >
                <X className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                არ ვიცი <span className="max-md:hidden" aria-hidden>←</span>
              </button>
              <button
                type="button"
                onClick={() => respond(true)}
                className="gen-focus inline-flex h-[54px] flex-1 items-center justify-center gap-2 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] text-[16px] font-bold text-[#15803d] md:h-[58px] md:w-[240px] md:flex-none dark:border-transparent dark:bg-[rgba(74,222,128,0.12)] dark:text-[#86efac]"
              >
                <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                ვიცი <span className="max-md:hidden" aria-hidden>→</span>
              </button>
            </div>
            <p className="mt-4 text-center text-[13px] text-[var(--gen-faint)] max-md:hidden">
              <kbd className="rounded-md border border-[var(--gen-border)] px-1.5 py-0.5 font-sans">Space</kbd> გადაბრუნება
            </p>
          </>
        )}
      </div>

      <CardListSheet open={listOpen} onClose={() => setListOpen(false)} deck={deck} session={session} />
    </div>
  );
}
