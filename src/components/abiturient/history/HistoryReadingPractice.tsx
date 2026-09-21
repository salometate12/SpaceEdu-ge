"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarRange,
  Check,
  Dices,
  Flame,
  Lightbulb,
  X,
} from "lucide-react";
import { recordDailyActivity } from "@/lib/daily-streak";
import {
  historyPaperLabel,
  pickRandomHistoryMcq,
  type HistoryMcqDraw,
} from "@/lib/history-past-paper-practice";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_SOLID,
  ACCENT_TEXT,
  PLAIN_CARD,
} from "@/components/landing/notebook/accents";
import { Pencil, Ruler, Sparkle } from "@/components/landing/notebook/Doodles";

const ACCENT = "violet" as const;

export function HistoryReadingPractice() {
  // Client-only (ssr:false), so the random draw on first render is safe.
  const [draw, setDraw] = useState<HistoryMcqDraw | null>(() => pickRandomHistoryMcq());
  const [picked, setPicked] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  const reroll = () => {
    setDraw(pickRandomHistoryMcq(draw?.question.id));
    setPicked(null);
  };

  const onPick = (label: string) => {
    if (picked || !draw) return;
    setPicked(label);
    setStreak((s) => (label === draw.question.correctLabel ? s + 1 : 0));
    recordDailyActivity();
  };

  const q = draw?.question;
  const revealed = picked !== null;

  return (
    <main className="relative mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Sparkle
        className={`pointer-events-none absolute right-6 top-8 hidden h-4 w-4 -rotate-12 opacity-70 lg:block ${ACCENT_TEXT[ACCENT]}`}
      />
      <Ruler className="pointer-events-none absolute -left-6 top-44 hidden w-20 -rotate-12 text-slate-400 opacity-60 xl:block dark:text-slate-500" />
      <Pencil className="pointer-events-none absolute -right-6 bottom-32 hidden h-11 w-11 rotate-12 text-amber-600/50 xl:block dark:text-amber-400/40" />

      <Link
        href="/subject/history/space"
        className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-300/80 bg-white/60 text-slate-600 transition-colors hover:border-slate-500 hover:text-slate-900 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
        aria-label="დაბრუნება"
      >
        <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
      </Link>

      {!q || !draw ? (
        <div className={`rounded-2xl border-2 p-10 text-center ${PLAIN_CARD}`}>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            ისტორიის ტესტური კითხვების ბანკი ჯერ მზადდება.
          </p>
        </div>
      ) : (
        <section className={`rounded-2xl border-2 p-6 ${ACCENT_CARD[ACCENT]}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${ACCENT_PILL[ACCENT]}`}
            >
              კითხვა · {q.number}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 ${PLAIN_CARD}`}
            >
              <CalendarRange className="h-3 w-3 stroke-[2.5]" aria-hidden />
              {historyPaperLabel(draw)}
            </span>
            {streak >= 2 && (
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-amber-400/70 bg-amber-100/70 px-3 py-1 text-[10px] font-bold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
                <Flame className="h-3 w-3 stroke-[2.5]" aria-hidden />
                {streak} ზედიზედ
              </span>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#121214]">
            <p className="text-[15px] font-medium leading-relaxed text-slate-900 dark:text-slate-100">
              {q.prompt}
            </p>

            <div className="mt-3 space-y-2">
              {q.options.map((opt) => {
                const isCorrect = revealed && opt.label === q.correctLabel;
                const isWrongPick = revealed && opt.label === picked && opt.label !== q.correctLabel;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={revealed}
                    onClick={() => onPick(opt.label)}
                    className={`flex w-full items-start gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm leading-relaxed transition disabled:cursor-default ${
                      isCorrect
                        ? "border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/10"
                        : isWrongPick
                          ? "border-rose-400 bg-rose-50 dark:border-rose-500/50 dark:bg-rose-500/10"
                          : "border-slate-200 hover:border-violet-300 dark:border-white/10 dark:hover:border-violet-400/40"
                    }`}
                  >
                    <span className="shrink-0 font-bold text-slate-500 dark:text-slate-400">
                      {opt.label})
                    </span>
                    <span className="min-w-0 flex-1 text-slate-800 dark:text-slate-200">
                      {opt.text}
                    </span>
                    {isCorrect && <Check className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
                    {isWrongPick && <X className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-rose-500" />}
                  </button>
                );
              })}
            </div>

            {revealed && (
              <div className="mt-4">
                <p
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ${
                    picked === q.correctLabel
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                  }`}
                >
                  {picked === q.correctLabel ? (
                    <>
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" /> სწორია
                    </>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5 stroke-[2.5]" /> სწორი პასუხი: {q.correctLabel}
                    </>
                  )}
                </p>
                <div className={`mt-2 rounded-xl border-2 p-3 ${PLAIN_CARD}`}>
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <Lightbulb className="h-3 w-3 stroke-[2.5]" />
                    რატომ არის ეს სწორი
                  </p>
                  <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
                    {q.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={reroll}
            className={`paper-sticker mt-5 flex w-full items-center justify-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-bold ${ACCENT_SOLID[ACCENT]}`}
          >
            <Dices className="h-4 w-4 stroke-[2.5]" aria-hidden />
            შემდეგი შემთხვევითი კითხვა
          </button>
        </section>
      )}
    </main>
  );
}
