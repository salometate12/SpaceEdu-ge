"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarRange,
  Dices,
  LoaderCircle,
  PenLine,
  Sparkles,
} from "lucide-react";
import { EssayReport } from "@/components/abiturient/exams/EssayReport";
import { useEssayGrading } from "@/components/abiturient/exams/useEssayGrading";
import { Flower, Pencil, Ruler, Sparkle } from "@/components/landing/notebook/Doodles";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_SOLID,
  ACCENT_TEXT,
  PLAIN_CARD,
} from "@/components/landing/notebook/accents";
import {
  georgianEssayTopics,
  pickRandomTopic,
  type EssayTopic,
} from "@/lib/georgian-essay-topics";

const ACCENT = "pink" as const;

/** The exam gives 250–400 words; below 150 it isn't marked for language. */
const TARGET_WORDS = 250;

export function EssayTopicPractice() {
  const topics = useMemo(() => georgianEssayTopics(), []);
  // Chosen during the first render — this component is loaded without SSR
  // precisely so the draw can be random without a hydration mismatch.
  const [topic, setTopic] = useState<EssayTopic | null>(() =>
    pickRandomTopic(topics),
  );
  const [essay, setEssay] = useState("");
  const essayGrading = useEssayGrading("abit-essay-practice");

  const words = useMemo(
    () => essay.trim().split(/\s+/).filter(Boolean).length,
    [essay],
  );

  const reroll = () => {
    setTopic(pickRandomTopic(topics, topic?.id));
    setEssay("");
    essayGrading.reset();
  };

  return (
    <main className="relative mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Sparkle
        className={`pointer-events-none absolute right-6 top-8 hidden h-4 w-4 -rotate-12 opacity-70 lg:block ${ACCENT_TEXT[ACCENT]}`}
      />
      <Ruler className="pointer-events-none absolute -left-6 top-44 hidden w-20 -rotate-12 text-slate-400 opacity-60 xl:block dark:text-slate-500" />
      <Pencil className="pointer-events-none absolute -right-6 bottom-32 hidden h-11 w-11 rotate-12 text-amber-600/50 xl:block dark:text-amber-400/40" />

      <Link
        href="/subject/georgian/space"
        className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-300/80 bg-white/60 text-slate-600 transition-colors hover:border-slate-500 hover:text-slate-900 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
        aria-label="დაბრუნება"
      >
        <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
      </Link>

      {!topic ? (
        <div className={`rounded-2xl border-2 p-10 text-center ${PLAIN_CARD}`}>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            წერითი დავალებების ბანკი ჯერ მზადდება.
          </p>
        </div>
      ) : (
        <>
          <section className={`rounded-2xl border-2 p-6 ${ACCENT_CARD[ACCENT]}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${ACCENT_PILL[ACCENT]}`}
              >
                <PenLine className="h-3 w-3 stroke-[2.5]" aria-hidden />
                წერითი დავალება · {topic.points} ქულა
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 ${PLAIN_CARD}`}
              >
                <CalendarRange className="h-3 w-3 stroke-[2.5]" aria-hidden />
                {topic.year} · {topic.variantLabel}
              </span>
            </div>

            <h1 className="headline mt-4 text-xl font-bold leading-relaxed text-slate-900 sm:text-2xl dark:text-slate-50">
              {topic.prompt}
            </h1>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              ტექსტი, რომელსაც თემა ეხებოდა: {topic.passageTitle} — {topic.passageAuthor}
            </p>

            <button
              type="button"
              onClick={reroll}
              className={`mt-5 inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 ${PLAIN_CARD}`}
            >
              <Dices className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
              სხვა თემა
            </button>
          </section>

          <section className={`mt-4 rounded-2xl border-2 p-5 sm:p-6 ${PLAIN_CARD}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                შენი ნაშრომი
              </span>
              <span
                className={`text-[11px] font-bold ${
                  words >= TARGET_WORDS
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {words} სიტყვა
              </span>
            </div>

            <textarea
              value={essay}
              onChange={(event) => setEssay(event.target.value)}
              placeholder="შესავალი თეზისით, არგუმენტები მაგალითებით, დასკვნა. საგამოცდო ნაშრომისთვის სასურველია 250-400 სიტყვა."
              className="exam-prose min-h-[360px] w-full resize-y rounded-2xl border-2 border-slate-300/80 bg-white/60 p-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-pink-500/70 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-500"
            />

            <ul className="mt-3 space-y-1.5 text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-400">
              {[
                "მსჯელობა აბზაცებად დაანაწევრე და არგუმენტები მაგალითებით გაამყარე.",
                "150 სიტყვაზე ნაკლები ნაშრომი ენობრივად არ ფასდება.",
              ].map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-pink-400" />
                  {tip}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => void essayGrading.grade(essay, topic.prompt)}
              disabled={essayGrading.busy || words === 0}
              className={`paper-sticker mt-5 flex w-full items-center justify-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${ACCENT_SOLID[ACCENT]}`}
            >
              {essayGrading.busy ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  მიმდინარეობს შეფასება...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 stroke-[2]" />
                  {essayGrading.result ? "ხელახლა შეაფასე" : "შეაფასე ნაშრომი"}
                </>
              )}
            </button>
          </section>

          {essayGrading.result && (
            <section className="mt-4">
              <EssayReport
                result={essayGrading.result}
                usedFallback={essayGrading.usedFallback}
              />
            </section>
          )}

          <Flower
            className={`pointer-events-none mx-auto mt-8 hidden h-10 w-10 rotate-12 opacity-50 sm:block ${ACCENT_TEXT[ACCENT]}`}
          />
        </>
      )}
    </main>
  );
}
