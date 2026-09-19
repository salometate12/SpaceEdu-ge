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
import type { MathOpenGraderResponse } from "@/lib/ai/math-open-problem-grader-schema";
import { MathText, MathBlock } from "./MathText";
import { useMathOpenGrading } from "./useMathOpenGrading";

/** A graded open problem, lifted to the exam so its score AND the mistakes it
 *  found survive to the results screen. */
interface OpenResult {
  result: MathOpenGraderResponse;
  usedFallback: boolean;
}

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
  onGraded,
}: {
  p: MathOpenProblem;
  onGraded: (result: MathOpenGraderResponse, usedFallback: boolean) => void;
}) {
  const [draft, setDraft] = useState("");
  const grading = useMathOpenGrading();

  useEffect(() => {
    if (grading.result) onGraded(grading.result, grading.usedFallback);
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
  // The whole graded report per open problem (keyed by number), not just its
  // score — so the results screen can add up the points AND show what went
  // wrong, exactly like the Georgian exam's score sheet.
  const [openResults, setOpenResults] = useState<Record<number, OpenResult>>({});
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
    () => Object.values(openResults).reduce((s, r) => s + r.result.score, 0),
    [openResults],
  );
  const openMax = useMemo(
    () => variant.open.reduce((s, p) => s + p.points, 0),
    [variant.open],
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
                onGraded={(result, usedFallback) =>
                  setOpenResults((s) => ({ ...s, [p.number]: { result, usedFallback } }))
                }
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
        <MathResults
          variant={variant}
          picks={picks}
          openResults={openResults}
          mcqScore={mcqScore}
          openScore={openScore}
          openMax={openMax}
          onRestart={() => {
            setPicks({});
            setOpenResults({});
            setRemaining(variant.durationMinutes * 60);
            setStage("mcq");
          }}
          onExit={onExit}
        />
      )}
    </main>
  );
}

/* ------------------------------ results ---------------------------------- */
/** The score sheet: the two parts summed into one exam total, the way the
 *  official scheme adds them — ტესტური კითხვები (37, one point each) + ღია
 *  ამოცანები (14) = 51 — with every open problem's mistakes gathered here too,
 *  so "what went wrong where" lives on one screen. Mirrors the Georgian exam. */
function MathResults({
  variant,
  picks,
  openResults,
  mcqScore,
  openScore,
  openMax,
  onRestart,
  onExit,
}: {
  variant: MathExamVariant;
  picks: Record<number, MathOptionLabel>;
  openResults: Record<number, OpenResult>;
  mcqScore: number;
  openScore: number;
  openMax: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const mcqMax = variant.mcq.length;
  const grandScore = mcqScore + openScore;
  const wrongMcq = variant.mcq.filter(
    (q) => picks[q.number] && picks[q.number] !== q.correctLabel,
  );
  const unansweredMcq = variant.mcq.filter((q) => !picks[q.number]);
  const ungradedOpen = variant.open.filter((p) => !openResults[p.number]);

  const rowClass =
    "flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-white/10 dark:bg-[#121214]";

  return (
    <div className="mt-8">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400">
          <Trophy className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">გამოცდა დასრულდა</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          {variant.label} · {variant.year}
        </p>
        <p className="mt-6 text-5xl font-black text-pink-600 dark:text-pink-400">
          {grandScore}
          <span className="text-2xl text-slate-400">/{variant.totalPoints}</span>
        </p>
        <p className="mt-1 text-sm font-bold text-slate-500 dark:text-zinc-400">
          {Math.round((grandScore / variant.totalPoints) * 100)}%
        </p>
      </div>

      {/* --------------------------- score sheet --------------------------- */}
      <div className="mx-auto mt-8 max-w-lg">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          შენი ქულა შეფასების სქემით
        </p>
        <div className="space-y-2">
          <div className={rowClass}>
            <span className="text-slate-600 dark:text-zinc-300">ტესტური კითხვები</span>
            <span className="font-bold tabular-nums text-slate-900 dark:text-white">
              {mcqScore} / {mcqMax}
            </span>
          </div>
          <div className={rowClass}>
            <span className="text-slate-600 dark:text-zinc-300">ღია ამოცანები</span>
            <span className="font-bold tabular-nums text-slate-900 dark:text-white">
              {openScore} / {openMax}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-pink-300/70 bg-pink-50 px-4 py-3 dark:border-pink-500/30 dark:bg-pink-500/10">
            <span className="text-sm font-bold text-slate-900 dark:text-white">ჯამური ქულა</span>
            <span className="text-lg font-black tabular-nums text-pink-700 dark:text-pink-300">
              {grandScore} / {variant.totalPoints}
            </span>
          </div>
        </div>
        {ungradedOpen.length > 0 && (
          <p className="mt-3 text-[12px] leading-relaxed text-slate-500 dark:text-zinc-400">
            {ungradedOpen.map((p) => `#${p.number}`).join(", ")} ღია ამოცანა ჯერ არ
            შეგიფასებია — ითვლება 0 ქულით. „თავიდან“ დაწყებისას თითოეულ ამოცანაზე დააჭირე
            „შეაფასე“, რომ სრული ჯამი დაითვალოს.
          </p>
        )}
      </div>

      {/* --------------------- open-problem mistakes ----------------------- */}
      {variant.open.length > 0 && (
        <div className="mx-auto mt-8 max-w-lg">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            ღია ამოცანების ჭრილში
          </p>
          <div className="space-y-3">
            {variant.open.map((p) => {
              const graded = openResults[p.number]?.result;
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#121214]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      ამოცანა {p.number}
                    </span>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        graded ? "text-slate-900 dark:text-white" : "text-slate-400"
                      }`}
                    >
                      {graded ? `${graded.score} / ${p.points}` : `— / ${p.points}`}
                    </span>
                  </div>
                  {graded ? (
                    <>
                      <ul className="mt-2.5 space-y-1.5">
                        {graded.steps.map((s) => (
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
                      {graded.mistake && (
                        <p className="mt-2.5 text-[13px] text-rose-700 dark:text-rose-300">
                          შეცდომა: {graded.mistake}
                        </p>
                      )}
                      {graded.correctMove && (
                        <p className="mt-1 text-[13px] text-emerald-700 dark:text-emerald-300">
                          სწორი ნაბიჯი: {graded.correctMove}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="mt-2 text-[13px] text-slate-400">შეუფასებელი.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------ test mistakes ---------------------------- */}
      {variant.mcq.length > 0 && (
        <div className="mx-auto mt-8 max-w-lg rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-white/10 dark:bg-[#121214]">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            ტესტური კითხვები
          </p>
          {wrongMcq.length === 0 && unansweredMcq.length === 0 ? (
            <p className="text-emerald-700 dark:text-emerald-300">ყველა კითხვა სწორია. 🎉</p>
          ) : (
            <div className="space-y-1.5 text-slate-600 dark:text-zinc-300">
              {wrongMcq.length > 0 && (
                <p>
                  <span className="font-bold text-rose-600 dark:text-rose-300">
                    არასწორი ({wrongMcq.length}):
                  </span>{" "}
                  {wrongMcq
                    .map((q) => `#${q.number} (შენ: ${picks[q.number]}, სწორი: ${q.correctLabel})`)
                    .join(", ")}
                </p>
              )}
              {unansweredMcq.length > 0 && (
                <p>
                  <span className="font-bold text-slate-500 dark:text-zinc-400">
                    უპასუხოდ ({unansweredMcq.length}):
                  </span>{" "}
                  {unansweredMcq.map((q) => `#${q.number}`).join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={onRestart}
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
  );
}
