"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  LoaderCircle,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import type {
  MathExamVariant,
  MathMcqQuestion,
  MathOpenProblem,
  MathOptionLabel,
} from "@/data/mathExamsData";
import { MathText, MathBlock } from "./MathText";
import { useMathOpenGrading } from "./useMathOpenGrading";

function formatClock(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Stage = "mcq" | "open" | "done";

/* ------------------------------ one MCQ ---------------------------------- */
function McqCard({
  q,
  picked,
  reveal,
  onPick,
}: {
  q: MathMcqQuestion;
  picked?: MathOptionLabel;
  reveal: boolean;
  onPick: (label: MathOptionLabel) => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#121214]">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-bold text-pink-700 dark:bg-pink-500/15 dark:text-pink-300">
          {q.number}
        </span>
        <MathText
          text={q.prompt}
          className="text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100"
        />
      </div>
      {q.latex && <MathBlock latex={q.latex} className="my-3 overflow-x-auto" />}
      {q.figure && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={q.figure.src} alt={q.figure.alt} className="my-3 max-h-56 w-auto" />
      )}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {q.options.map((opt) => {
          const isPicked = picked === opt.label;
          const isCorrect = reveal && opt.label === q.correctLabel;
          const isWrongPick = reveal && isPicked && opt.label !== q.correctLabel;
          return (
            <button
              key={opt.label}
              type="button"
              disabled={reveal}
              onClick={() => onPick(opt.label)}
              className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm transition ${
                isCorrect
                  ? "border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/10"
                  : isWrongPick
                    ? "border-rose-400 bg-rose-50 dark:border-rose-500/50 dark:bg-rose-500/10"
                    : isPicked
                      ? "border-pink-400 bg-pink-50 dark:border-pink-500/50 dark:bg-pink-500/10"
                      : "border-slate-200 hover:border-pink-300 dark:border-white/10 dark:hover:border-pink-400/40"
              }`}
            >
              <span className="shrink-0 font-bold text-slate-500 dark:text-slate-400">
                {opt.label})
              </span>
              {opt.latex ? <MathText text={`$${opt.latex}$`} /> : <span>{opt.text}</span>}
              {isCorrect && <Check className="ml-auto h-4 w-4 text-emerald-600" />}
              {isWrongPick && <X className="ml-auto h-4 w-4 text-rose-500" />}
            </button>
          );
        })}
      </div>
    </article>
  );
}

/* --------------------------- one open problem ---------------------------- */
function OpenProblemCard({
  p,
  onScored,
}: {
  p: MathOpenProblem;
  onScored: (score: number) => void;
}) {
  const [draft, setDraft] = useState("");
  const grading = useMathOpenGrading();

  useEffect(() => {
    if (grading.result) onScored(grading.result.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grading.result]);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#121214]">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          {p.number} · {p.points} ქულა
        </span>
        <MathText
          text={p.prompt}
          className="text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100"
        />
      </div>
      {p.latex && <MathBlock latex={p.latex} className="my-3 overflow-x-auto" />}
      {p.figure && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.figure.src} alt={p.figure.alt} className="my-3 max-h-56 w-auto" />
      )}

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="ჩაწერე სრული ამოხსნის გზა — ეტაპობრივად..."
        className="mt-3 min-h-[160px] w-full resize-y rounded-xl border-2 border-slate-300/80 bg-white p-3 text-sm text-slate-900 outline-none focus:border-pink-500/70 dark:border-white/[0.14] dark:bg-[#0c0b12] dark:text-slate-100"
      />

      <button
        type="button"
        onClick={() => void grading.grade(p, draft)}
        disabled={grading.busy || draft.trim().length === 0}
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-pink-600 px-4 py-2 text-sm font-bold text-white hover:bg-pink-700 disabled:opacity-50"
      >
        {grading.busy ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" /> მიმდინარეობს შეფასება...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> {grading.result ? "ხელახლა შეაფასე" : "შეაფასე (AI)"}
          </>
        )}
      </button>

      {grading.result && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {grading.result.score}/{p.points} ქულა
          </p>
          {grading.usedFallback && (
            <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
              AI მიუწვდომელია — სავარაუდო ლოკალური შეფასება.
            </p>
          )}
          <p className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-zinc-300">
            {grading.result.summary}
          </p>
          <ul className="mt-3 space-y-1.5">
            {grading.result.steps.map((s) => (
              <li key={s.id} className="flex items-start gap-2 text-[13px]">
                {s.done ? (
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                )}
                <span className="text-slate-700 dark:text-zinc-300">
                  {p.steps.find((st) => st.id === s.id)?.description ?? s.id}
                  {s.comment ? ` — ${s.comment}` : ""}
                </span>
              </li>
            ))}
          </ul>
          {grading.result.mistake && (
            <p className="mt-3 text-[13px] text-rose-700 dark:text-rose-300">
              შეცდომა: {grading.result.mistake}
            </p>
          )}
          {grading.result.correctMove && (
            <p className="mt-1 text-[13px] text-emerald-700 dark:text-emerald-300">
              სწორი ნაბიჯი: {grading.result.correctMove}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

/* ------------------------------ the exam --------------------------------- */
export function MathExamSimulation({
  variant,
  onExit,
}: {
  variant: MathExamVariant;
  onExit: () => void;
}) {
  const [stage, setStage] = useState<Stage>("mcq");
  const [picks, setPicks] = useState<Record<number, MathOptionLabel>>({});
  const [openScores, setOpenScores] = useState<Record<number, number>>({});
  const [remaining, setRemaining] = useState(variant.durationMinutes * 60);

  useEffect(() => {
    if (stage === "done") return;
    const id = window.setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearInterval(id);
  }, [stage]);

  const mcqScore = useMemo(
    () => variant.mcq.reduce((s, q) => s + (picks[q.number] === q.correctLabel ? 1 : 0), 0),
    [variant.mcq, picks],
  );
  const openScore = useMemo(
    () => Object.values(openScores).reduce((s, v) => s + v, 0),
    [openScores],
  );
  const answeredMcq = Object.keys(picks).length;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> არქივზე დაბრუნება
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-pink-300/60 bg-pink-50 px-3 py-1 text-sm font-bold text-pink-700 dark:border-pink-500/25 dark:bg-pink-500/10 dark:text-pink-200">
          <Clock className="h-3.5 w-3.5" /> {formatClock(remaining)}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        მათემატიკა — {variant.label} · {variant.year}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        {variant.mcq.length} ტესტური კითხვა · {variant.open.length} ღია ამოცანა · სულ{" "}
        {variant.totalPoints} ქულა
      </p>

      {variant.mcq.length === 0 && variant.open.length === 0 && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/15 dark:text-zinc-400">
          ამ ვარიანტის კითხვები მალე დაემატება.
        </div>
      )}

      {stage === "mcq" && variant.mcq.length > 0 && (
        <>
          <div className="mt-6 space-y-4">
            {variant.mcq.map((q) => (
              <McqCard
                key={q.id}
                q={q}
                picked={picks[q.number]}
                reveal={false}
                onPick={(label) => setPicks((p) => ({ ...p, [q.number]: label }))}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStage(variant.open.length > 0 ? "open" : "done")}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink-600 px-5 py-3 text-sm font-bold text-white hover:bg-pink-700 sm:w-auto"
          >
            {variant.open.length > 0 ? "ღია ამოცანებზე გადასვლა" : "დასრულება"}
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-2 text-xs text-slate-400">
            მონიშნულია {answeredMcq}/{variant.mcq.length}
          </p>
        </>
      )}

      {stage === "open" && (
        <>
          <div className="mt-6 space-y-4">
            {variant.open.map((p) => (
              <OpenProblemCard
                key={p.id}
                p={p}
                onScored={(score) => setOpenScores((s) => ({ ...s, [p.number]: score }))}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStage("done")}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink-600 px-5 py-3 text-sm font-bold text-white hover:bg-pink-700 sm:w-auto"
          >
            გამოცდის დასრულება
            <ArrowRight className="h-4 w-4" />
          </button>
        </>
      )}

      {stage === "done" && (
        <div className="mt-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400">
            <Trophy className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">გამოცდა დასრულდა</h2>
          <div className="mt-6 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#121214]">
            <p className="text-4xl font-black text-pink-600 dark:text-pink-400">
              {mcqScore + openScore}
              <span className="text-xl text-slate-400">/{variant.totalPoints}</span>
            </p>
            <div className="mt-4 space-y-1 text-left text-sm text-slate-600 dark:text-zinc-300">
              <p>ტესტური კითხვები: {mcqScore}/{variant.mcq.length}</p>
              <p>ღია ამოცანები: {openScore} ქულა</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setPicks({});
                setOpenScores({});
                setRemaining(variant.durationMinutes * 60);
                setStage("mcq");
              }}
              className="rounded-full bg-pink-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-pink-700"
            >
              თავიდან
            </button>
            <button
              type="button"
              onClick={onExit}
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 dark:border-white/10 dark:text-zinc-200"
            >
              არქივზე დაბრუნება
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
