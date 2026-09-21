"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CalendarRange, Dices, LoaderCircle, Sparkles } from "lucide-react";
import { useEnglishWritingGrading } from "@/components/abiturient/exams/useEnglishWritingGrading";
import { EnglishWritingReport } from "@/components/abiturient/english/EnglishWritingReport";
import {
  englishPaperLabel,
  pickRandomEnglishEssay,
  type EnglishEssayDraw,
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

/** Task 7 essay drill: a random archive prompt, an essay box with a live word
 *  count, and an AI report against the official 4×4 rubric (Content /
 *  Organization / Vocabulary / Grammar). Under 100 words is not graded. */
export function EnglishWritingPractice() {
  // Client-only (ssr:false), so the random draw on first render is safe.
  const [draw, setDraw] = useState<EnglishEssayDraw | null>(() => pickRandomEnglishEssay());
  const [essay, setEssay] = useState("");
  const grading = useEnglishWritingGrading("abit-english-writing-practice");

  const reroll = () => {
    setDraw(pickRandomEnglishEssay(draw?.essay.id));
    setEssay("");
    grading.reset();
  };

  const e = draw?.essay;
  const words = essay.trim() ? essay.trim().split(/\s+/).filter(Boolean).length : 0;

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

      {!e || !draw ? (
        <div className={`rounded-2xl border-2 p-10 text-center ${PLAIN_CARD}`}>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            წერითი დავალების ბანკი ჯერ მზადდება.
          </p>
        </div>
      ) : (
        <>
          <section className={`rounded-2xl border-2 p-6 ${ACCENT_CARD[ACCENT]}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${ACCENT_PILL[ACCENT]}`}
              >
                Task 7 · Writing · {e.points} ქულა
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 ${PLAIN_CARD}`}
              >
                <CalendarRange className="h-3 w-3 stroke-[2.5]" aria-hidden />
                {englishPaperLabel(draw)}
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#121214]">
              <p className="text-[15px] font-medium leading-relaxed text-slate-900 dark:text-slate-100">
                {e.prompt}
              </p>
              <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">
                Write between {e.minWords}–{e.maxWords} words.
              </p>
            </div>

            <button
              type="button"
              onClick={reroll}
              className={`mt-4 inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 ${PLAIN_CARD}`}
            >
              <Dices className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
              სხვა თემა
            </button>
          </section>

          <section className="mt-4 rounded-2xl border-2 border-slate-300/80 bg-white/60 p-5 shadow-sm sm:p-6 dark:border-amber-400/20 dark:bg-white/[0.05]">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Your essay
              </span>
              <span
                className={`text-[11px] font-bold ${
                  words >= e.minWords
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 dark:text-zinc-400"
                }`}
              >
                {words} words
              </span>
            </div>
            <textarea
              value={essay}
              onChange={(ev) => setEssay(ev.target.value)}
              placeholder="Write your essay here…"
              className="min-h-[280px] w-full resize-y rounded-2xl border-2 border-slate-300/80 bg-white p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500/70 dark:border-white/[0.14] dark:bg-[#0c0b12] dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <p className="mt-2 text-[12px] leading-relaxed text-slate-500 dark:text-zinc-400">
              120 სიტყვაზე ნაკლებს ქულა აკლდება; 100-ზე ნაკლები საერთოდ არ ფასდება (0).
            </p>

            <button
              type="button"
              onClick={() =>
                void grading.grade(essay, { prompt: e.prompt, minWords: e.minWords, maxWords: e.maxWords })
              }
              disabled={grading.busy || essay.trim().length === 0}
              className={`paper-sticker mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${ACCENT_SOLID[ACCENT]}`}
            >
              {grading.busy ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  მიმდინარეობს შეფასება...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 stroke-[2]" />
                  {grading.result ? "ხელახლა შეაფასე" : "შეაფასე (AI)"}
                </>
              )}
            </button>

            {grading.result && (
              <div className="mt-4">
                <EnglishWritingReport result={grading.result} usedFallback={grading.usedFallback} />
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
