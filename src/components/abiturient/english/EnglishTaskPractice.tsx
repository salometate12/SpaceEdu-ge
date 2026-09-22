"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CalendarRange, Dices } from "lucide-react";
import { EnglishTaskBody } from "@/components/abiturient/english/EnglishTaskBody";
import { recordDailyActivity } from "@/lib/daily-streak";
import {
  englishPaperLabel,
  pickRandomEnglishTask,
  type EnglishTaskDraw,
} from "@/lib/english-past-paper-practice";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_SOLID,
  ACCENT_TEXT,
  PLAIN_CARD,
} from "@/components/landing/notebook/accents";
import { Pencil, Ruler, Sparkle } from "@/components/landing/notebook/Doodles";

const ACCENT = "amber" as const;

/** Random-task drill: draws a whole task (listening / reading / vocabulary /
 *  grammar / dialogue) from the archive and lets the student answer its items
 *  with instant checking (reveal on). Listening replays are unlimited here,
 *  since practice isn't the timed exam. */
export function EnglishTaskPractice() {
  // Client-only (ssr:false), so the random draw on first render is safe.
  const [draw, setDraw] = useState<EnglishTaskDraw | null>(() => pickRandomEnglishTask());
  const [picks, setPicks] = useState<Record<string, string>>({});

  const reroll = () => {
    setDraw(pickRandomEnglishTask(draw?.task.id));
    setPicks({});
  };

  const onPick = (itemId: string, label: string) => {
    // Reveal mode locks a pick once made; ignore repeats on the same item.
    if (picks[itemId]) return;
    setPicks((prev) => ({ ...prev, [itemId]: label }));
    recordDailyActivity();
  };

  const task = draw?.task;

  return (
    <main className="relative mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Sparkle
        className={`pointer-events-none absolute right-6 top-8 hidden h-4 w-4 -rotate-12 opacity-70 lg:block ${ACCENT_TEXT[ACCENT]}`}
      />
      <Ruler className="pointer-events-none absolute -left-6 top-44 hidden w-20 -rotate-12 text-slate-400 opacity-60 xl:block dark:text-slate-500" />
      <Pencil className="pointer-events-none absolute -right-6 bottom-32 hidden h-11 w-11 rotate-12 text-amber-600/50 xl:block dark:text-amber-400/40" />

      <Link
        href="/subject/english/space"
        className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-300/80 bg-white/60 text-slate-600 transition-colors hover:border-slate-500 hover:text-slate-900 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
        aria-label="დაბრუნება"
      >
        <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
      </Link>

      {!task || !draw ? (
        <div className={`rounded-2xl border-2 p-10 text-center ${PLAIN_CARD}`}>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            ინგლისურის სავარჯიშო დავალებების ბანკი ჯერ მზადდება.
          </p>
        </div>
      ) : (
        <section className={`rounded-2xl border-2 p-6 ${ACCENT_CARD[ACCENT]}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${ACCENT_PILL[ACCENT]}`}
            >
              Task {task.number} · {task.title}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 ${PLAIN_CARD}`}
            >
              <CalendarRange className="h-3 w-3 stroke-[2.5]" aria-hidden />
              {englishPaperLabel(draw)}
            </span>
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400">
            {task.instruction}
          </p>

          <div className="mt-4">
            <EnglishTaskBody
              task={task}
              picks={picks}
              onPick={onPick}
              reveal
              unlimitedAudio
            />
          </div>

          <button
            type="button"
            onClick={reroll}
            className={`paper-sticker mt-5 flex w-full items-center justify-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-bold ${ACCENT_SOLID[ACCENT]}`}
          >
            <Dices className="h-4 w-4 stroke-[2.5]" aria-hidden />
            შემდეგი შემთხვევითი დავალება
          </button>
        </section>
      )}
    </main>
  );
}
