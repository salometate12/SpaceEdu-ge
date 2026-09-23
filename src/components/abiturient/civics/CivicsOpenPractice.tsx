"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CalendarRange, Check, Dices, LoaderCircle, Sparkles, X } from "lucide-react";
import { CivicsQuestionFigures } from "@/components/abiturient/civics/CivicsQuestionFigures";
import { gradeCivicsOpenSubItem } from "@/components/abiturient/exams/useCivicsOpenGrading";
import type { CivicsOpenGraderReport } from "@/lib/ai/civics-open-task-grader-schema";
import { recordToolUsage } from "@/lib/activity";
import {
  civicsPaperLabel,
  pickRandomCivicsOpen,
  type CivicsOpenDraw,
} from "@/lib/civics-past-paper-practice";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_SOLID,
  ACCENT_TEXT,
  PLAIN_CARD,
} from "@/components/landing/notebook/accents";
import { Pencil, Ruler, Sparkle } from "@/components/landing/notebook/Doodles";

const ACCENT = "pink" as const;

export function CivicsOpenPractice() {
  const [draw, setDraw] = useState<CivicsOpenDraw | null>(() => pickRandomCivicsOpen());
  const [answer, setAnswer] = useState("");
  const [report, setReport] = useState<CivicsOpenGraderReport | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [busy, setBusy] = useState(false);

  const reroll = () => {
    setDraw(pickRandomCivicsOpen(draw?.subItem.id));
    setAnswer("");
    setReport(null);
    setUsedFallback(false);
  };

  const grade = async () => {
    if (!draw || !answer.trim() || busy) return;
    setBusy(true);
    setReport(null);
    recordToolUsage("abit-civics-open-practice", "სამოქალაქოს ღია დავალების შემფასებელი");
    try {
      const outcome = await gradeCivicsOpenSubItem(draw.subItem, draw.task, answer);
      setReport(outcome.report);
      setUsedFallback(outcome.usedFallback);
    } finally {
      setBusy(false);
    }
  };

  const subItem = draw?.subItem;
  const task = draw?.task;
  const criteria = subItem?.criteria ?? [];

  return (
    <main className="relative mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Sparkle className={`pointer-events-none absolute right-6 top-8 hidden h-4 w-4 -rotate-12 opacity-70 lg:block ${ACCENT_TEXT[ACCENT]}`} />
      <Ruler className="pointer-events-none absolute -left-6 top-44 hidden w-20 -rotate-12 text-slate-400 opacity-60 xl:block dark:text-slate-500" />
      <Pencil className="pointer-events-none absolute -right-6 bottom-32 hidden h-11 w-11 rotate-12 text-amber-600/50 xl:block dark:text-amber-400/40" />

      <Link
        href="/subject/civics/space"
        className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-300/80 bg-white/60 text-slate-600 transition-colors hover:border-slate-500 hover:text-slate-900 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
        aria-label="დაბრუნება"
      >
        <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
      </Link>

      {!subItem || !task || !draw ? (
        <div className={`rounded-2xl border-2 p-10 text-center ${PLAIN_CARD}`}>
          <p className="text-sm text-slate-700 dark:text-slate-300">ღია დავალებების ბანკი ჯერ მზადდება.</p>
        </div>
      ) : (
        <>
          <section className={`rounded-2xl border-2 p-6 ${ACCENT_CARD[ACCENT]}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${ACCENT_PILL[ACCENT]}`}>
                ღია დავალება · {subItem.id} · {subItem.maxPoints} ქულა
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 ${PLAIN_CARD}`}>
                <CalendarRange className="h-3 w-3 stroke-[2.5]" aria-hidden />
                {civicsPaperLabel(draw)}
              </span>
            </div>

            <p className="mt-3 text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400">{task.instruction}</p>
            {task.sourceTexts && (
              <div className="mt-3 space-y-2">
                {task.sourceTexts.map((s) => (
                  <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#121214]">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-pink-700 dark:text-pink-300">{s.label}</p>
                    {s.figure && <CivicsQuestionFigures figures={[s.figure]} />}
                    {s.text && <p className="mt-1 whitespace-pre-line text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-200">{s.text}</p>}
                    {s.attribution && <p className="mt-1 text-[11px] italic text-slate-400 dark:text-zinc-500">{s.attribution}</p>}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#121214]">
              <p className="text-[15px] font-medium leading-relaxed text-slate-900 dark:text-slate-100">{subItem.prompt}</p>
            </div>

            <button
              type="button"
              onClick={reroll}
              className={`mt-4 inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 ${PLAIN_CARD}`}
            >
              <Dices className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
              სხვა დავალება
            </button>
          </section>

          <section className="mt-4 rounded-2xl border-2 border-slate-300/80 bg-white/60 p-5 shadow-sm sm:p-6 dark:border-pink-400/20 dark:bg-white/[0.05]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">შენი პასუხი</span>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="ჩაწერე პასუხი..."
              className="mt-2 min-h-[160px] w-full resize-y rounded-2xl border-2 border-slate-300/80 bg-white p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-pink-500/70 dark:border-white/[0.14] dark:bg-[#0c0b12] dark:text-slate-100 dark:placeholder:text-slate-500"
            />

            <button
              type="button"
              onClick={() => void grade()}
              disabled={busy || answer.trim().length === 0}
              className={`paper-sticker mt-4 flex w-full items-center justify-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${ACCENT_SOLID[ACCENT]}`}
            >
              {busy ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  მიმდინარეობს შეფასება...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 stroke-[2]" />
                  {report ? "ხელახლა შეაფასე" : "შეაფასე (AI)"}
                </>
              )}
            </button>

            {report && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    {report.score} / {subItem.maxPoints} ქულა
                  </p>
                  {usedFallback && (
                    <span className="text-[11px] text-amber-700 dark:text-amber-300">AI მიუწვდომელია — სავარაუდო</span>
                  )}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {report.criteria.map((c) => {
                    const rubric = criteria.find((rc) => rc.id === c.id);
                    return (
                      <li key={c.id} className="flex items-start gap-2 text-[13px]">
                        {c.met ? (
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        ) : (
                          <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                        )}
                        <span className="text-slate-700 dark:text-zinc-300">
                          {rubric?.description ?? c.id}
                          {c.comment ? ` — ${c.comment}` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {(report.correctAnswer || subItem.modelAnswer) && (
                  <p className="mt-3 text-[13px] text-emerald-700 dark:text-emerald-300">
                    სწორი პასუხი: {report.correctAnswer || subItem.modelAnswer}
                  </p>
                )}
                {report.explanation && (
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-zinc-300">
                    რატომ არის სწორი: {report.explanation}
                  </p>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
