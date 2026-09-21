"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarRange,
  Check,
  Dices,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";
import { useHistoryOpenGrading } from "@/components/abiturient/exams/useHistoryOpenGrading";
import type { HistorySourceDocument } from "@/data/historyExamsData";
import {
  historyPaperLabel,
  pickRandomHistoryOpenSubItem,
  type HistoryOpenDraw,
} from "@/lib/history-past-paper-practice";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_SOLID,
  ACCENT_TEXT,
  PLAIN_CARD,
} from "@/components/landing/notebook/accents";
import { Pencil, Ruler, Sparkle } from "@/components/landing/notebook/Doodles";

const ACCENT = "amber" as const;

/** The source document with the paper's own "page 1/2/3" tabs. */
function SourceDocumentView({ doc }: { doc: HistorySourceDocument }) {
  const [page, setPage] = useState(0);
  const multi = doc.pages.length > 1;
  return (
    <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/50 p-4 dark:border-violet-500/25 dark:bg-violet-500/[0.06]">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
        <BookOpen className="h-3 w-3 stroke-[2.5]" />
        ისტორიული დოკუმენტი
      </div>
      <h4 className="mt-1.5 text-base font-bold text-slate-900 dark:text-white">{doc.title}</h4>
      {multi && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {doc.pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={`rounded-full border-2 px-3 py-1 text-[11px] font-bold transition ${
                page === i
                  ? "border-violet-400 bg-violet-100 text-violet-800 dark:border-violet-400/40 dark:bg-violet-500/15 dark:text-violet-200"
                  : "border-slate-200 bg-white/60 text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400"
              }`}
            >
              {i + 1}-ლი გვერდი
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 whitespace-pre-line text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-200">
        {doc.pages[page]}
      </p>
      <p className="mt-3 text-[11px] italic text-slate-400 dark:text-zinc-500">{doc.authorOrSource}</p>
    </div>
  );
}

export function HistoryWritingPractice() {
  // Client-only (ssr:false), so the random draw on first render is safe.
  const [draw, setDraw] = useState<HistoryOpenDraw | null>(() =>
    pickRandomHistoryOpenSubItem(),
  );
  const [answer, setAnswer] = useState("");
  const grading = useHistoryOpenGrading("abit-history-open-practice");

  const reroll = () => {
    setDraw(pickRandomHistoryOpenSubItem(draw?.subItem.id));
    setAnswer("");
    grading.reset();
  };

  const sub = draw?.subItem;
  const task = draw?.task;
  const report = grading.report;

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

      {!sub || !task || !draw ? (
        <div className={`rounded-2xl border-2 p-10 text-center ${PLAIN_CARD}`}>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            ისტორიის ღია დავალებების ბანკი ჯერ მზადდება.
          </p>
        </div>
      ) : (
        <>
          <section className={`rounded-2xl border-2 p-6 ${ACCENT_CARD[ACCENT]}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${ACCENT_PILL[ACCENT]}`}
              >
                დავალება · {sub.id} · {sub.maxPoints} ქულა
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 ${PLAIN_CARD}`}
              >
                <CalendarRange className="h-3 w-3 stroke-[2.5]" aria-hidden />
                {historyPaperLabel(draw)} · {task.title}
              </span>
            </div>

            {task.sourceDocument && (
              <div className="mt-4">
                <SourceDocumentView doc={task.sourceDocument} />
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#121214]">
              <p className="text-[15px] font-medium leading-relaxed text-slate-900 dark:text-slate-100">
                {sub.prompt}
              </p>
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

          <section className="mt-4 rounded-2xl border-2 border-slate-300/80 bg-white/60 p-5 shadow-sm sm:p-6 dark:border-amber-400/20 dark:bg-white/[0.05]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              შენი პასუხი
            </span>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="ჩაწერე პასუხი..."
              className="mt-2 min-h-[160px] w-full resize-y rounded-2xl border-2 border-slate-300/80 bg-white p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500/70 dark:border-white/[0.14] dark:bg-[#0c0b12] dark:text-slate-100 dark:placeholder:text-slate-500"
            />

            <button
              type="button"
              onClick={() =>
                void grading.grade(sub, task.sourceDocument?.pages.join("\n\n"), answer)
              }
              disabled={grading.busy || answer.trim().length === 0}
              className={`paper-sticker mt-4 flex w-full items-center justify-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${ACCENT_SOLID[ACCENT]}`}
            >
              {grading.busy ? (
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
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {report.score}/{sub.maxPoints} ქულა
                </p>
                {grading.usedFallback && (
                  <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                    AI მიუწვდომელია — სავარაუდო ლოკალური შეფასება.
                  </p>
                )}
                <p className="mt-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  რა შეამოწმა AI-მ
                </p>
                <ul className="space-y-1.5">
                  {report.criteria.map((c) => {
                    const rubric = sub.criteria.find((rc) => rc.id === c.id);
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
                {report.correctAnswer && (
                  <p className="mt-3 text-[13px] text-emerald-700 dark:text-emerald-300">
                    სწორი პასუხი: {report.correctAnswer}
                  </p>
                )}
                {report.explanation && (
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-zinc-300">
                    რატომ არის სწორი: {report.explanation}
                  </p>
                )}
                {report.whatWasMissing && (
                  <p className="mt-1 text-[13px] text-rose-700 dark:text-rose-300">
                    რა გამოგრჩა: {report.whatWasMissing}
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
