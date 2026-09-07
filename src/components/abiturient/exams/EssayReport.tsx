"use client";

import { motion } from "framer-motion";
import { CircleAlert, ThumbsUp, Wrench } from "lucide-react";
import {
  ESSAY_CRITERION_HINTS,
  ESSAY_CRITERION_LABELS,
  ESSAY_CRITERION_MAX,
  ESSAY_TOTAL_MAX,
  type EssayCriterionId,
  type EssayGraderResponse,
} from "@/lib/ai/essay-grader-schema";

export function essayScoreTone(score: number, max: number): string {
  const ratio = score / max;
  if (ratio >= 0.8) return "#10b981";
  if (ratio >= 0.55) return "#f59e0b";
  return "#f43f5e";
}

/**
 * The scored report, shared by the standalone essay page and the in-exam
 * writing stage. Theme-aware so it reads in both modes.
 */
export function EssayReport({
  result,
  usedFallback,
  compact = false,
}: {
  result: EssayGraderResponse;
  usedFallback?: boolean;
  /** Drops the outer card so it can sit inside an existing panel. */
  compact?: boolean;
}) {
  const shell = compact
    ? "space-y-4"
    : "space-y-4";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={shell}
    >
      {/* ------------------------------ total ------------------------------ */}
      <div
        className={
          compact
            ? "rounded-2xl border border-slate-200 bg-white/70 p-5 text-center dark:border-white/10 dark:bg-white/[0.03]"
            : "rounded-2xl border border-slate-200 bg-white/85 p-6 text-center dark:border-white/10 dark:bg-[#0D0D15]/80"
        }
      >
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          საბოლოო ქულა
        </p>
        <p className="mt-2 text-5xl font-black text-slate-900 dark:text-white">
          {result.totalScore}
          <span className="text-2xl font-bold text-slate-400 dark:text-zinc-500">
            /{ESSAY_TOTAL_MAX}
          </span>
        </p>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full"
            style={{
              backgroundColor: essayScoreTone(result.totalScore, ESSAY_TOTAL_MAX),
            }}
            initial={{ width: 0 }}
            animate={{ width: `${(result.totalScore / ESSAY_TOTAL_MAX) * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <p className="mt-4 text-left text-[13px] leading-relaxed text-slate-600 dark:text-zinc-400">
          {result.summary}
        </p>
        {usedFallback && (
          <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-left text-[11px] leading-relaxed text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/[0.06] dark:text-amber-200/80">
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 stroke-[1.75]" />
            AI მიუწვდომელია — ნაჩვენებია ლოკალური რუბრიკული შეფასება.
          </p>
        )}
      </div>

      {/* ---------------------------- criteria ----------------------------- */}
      <div
        className={
          compact
            ? "rounded-2xl border border-slate-200 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]"
            : "rounded-2xl border border-slate-200 bg-white/85 p-5 dark:border-white/10 dark:bg-[#0D0D15]/80"
        }
      >
        <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          კრიტერიუმები
        </p>
        <div className="space-y-4">
          {result.criteria.map((criterion) => {
            const id = criterion.id as EssayCriterionId;
            const tone = essayScoreTone(criterion.score, ESSAY_CRITERION_MAX);
            return (
              <div key={id}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {ESSAY_CRITERION_LABELS[id]}
                  </span>
                  <span className="text-sm font-bold" style={{ color: tone }}>
                    {criterion.score}/{ESSAY_CRITERION_MAX}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-zinc-600">
                  {ESSAY_CRITERION_HINTS[id]}
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: tone }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(criterion.score / ESSAY_CRITERION_MAX) * 100}%`,
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600 dark:text-zinc-400">
                  {criterion.comment}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------------------- strengths ---------------------------- */}
      {result.strengths.length > 0 && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-5 dark:border-emerald-500/25 dark:bg-emerald-950/20">
          <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <ThumbsUp className="h-3 w-3 stroke-[2]" />
            ძლიერი მხარეები
          </p>
          <ul className="space-y-1.5">
            {result.strengths.map((strength) => (
              <li
                key={strength}
                className="flex gap-2 text-[13px] leading-relaxed text-emerald-900/85 dark:text-emerald-50/85"
              >
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --------------------------- corrections --------------------------- */}
      {result.corrections.length > 0 && (
        <div className="rounded-2xl border border-cyan-300 bg-cyan-50/80 p-5 dark:border-cyan-500/30 dark:bg-cyan-950/30">
          <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
            <Wrench className="h-3 w-3 stroke-[2]" />
            რა გავასწოროთ
          </p>
          <ul className="space-y-3">
            {result.corrections.map((correction) => (
              <li key={correction.issue}>
                <p className="text-[13px] font-semibold leading-relaxed text-cyan-900 dark:text-cyan-100">
                  {correction.issue}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-cyan-800/80 dark:text-cyan-50/70">
                  → {correction.fix}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
