"use client";

import { motion } from "framer-motion";
import { CircleAlert, Wrench } from "lucide-react";
import {
  TEXT_EDITING_CRITERION_LABELS,
  TEXT_EDITING_TOTAL_MAX,
  textEditingMaxes,
  type TextEditingCriterionId,
  type TextEditingGraderResponse,
} from "@/lib/ai/text-editing-grader-schema";
import { scoreTone } from "./WritingTaskReport";

/** The scored report for the 16-point Part I text-editing task. */
export function TextEditingReport({
  result,
  year = 2025,
  usedFallback,
  compact = false,
}: {
  result: TextEditingGraderResponse;
  year?: number;
  usedFallback?: boolean;
  compact?: boolean;
}) {
  const maxes = textEditingMaxes(year);
  const cardTotal = compact
    ? "rounded-2xl border border-slate-200 bg-white/70 p-5 text-center dark:border-white/10 dark:bg-white/[0.03]"
    : "rounded-2xl border border-slate-200 bg-white/85 p-6 text-center dark:border-white/10 dark:bg-[#0D0D15]/80";
  const cardBody = compact
    ? "rounded-2xl border border-slate-200 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]"
    : "rounded-2xl border border-slate-200 bg-white/85 p-5 dark:border-white/10 dark:bg-[#0D0D15]/80";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className={cardTotal}>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          ტექსტის რედაქტირება — ქულა
        </p>
        <p className="mt-2 text-5xl font-black text-slate-900 dark:text-white">
          {result.totalScore}
          <span className="text-2xl font-bold text-slate-400 dark:text-zinc-500">
            /{TEXT_EDITING_TOTAL_MAX}
          </span>
        </p>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: scoreTone(result.totalScore, TEXT_EDITING_TOTAL_MAX) }}
            initial={{ width: 0 }}
            animate={{ width: `${(result.totalScore / TEXT_EDITING_TOTAL_MAX) * 100}%` }}
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

      <div className={cardBody}>
        <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          კრიტერიუმები
        </p>
        <div className="space-y-4">
          {result.criteria.map((criterion) => {
            const id = criterion.id as TextEditingCriterionId;
            const max = maxes[id];
            const tone = scoreTone(criterion.score, max);
            return (
              <div key={id}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {id}. {TEXT_EDITING_CRITERION_LABELS[id]}
                  </span>
                  <span className="shrink-0 text-sm font-bold" style={{ color: tone }}>
                    {criterion.score}/{max}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: tone }}
                    initial={{ width: 0 }}
                    animate={{ width: `${max > 0 ? (criterion.score / max) * 100 : 0}%` }}
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

      {result.corrections.length > 0 && (
        <div className="rounded-2xl border border-cyan-300 bg-cyan-50/80 p-5 dark:border-cyan-500/30 dark:bg-cyan-950/30">
          <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
            <Wrench className="h-3 w-3 stroke-[2]" />
            გამორჩენილი შესწორებები
          </p>
          <ul className="space-y-3">
            {result.corrections.map((correction, i) => (
              <li key={`${correction.original}-${i}`}>
                <p className="text-[13px] font-semibold leading-relaxed text-cyan-900 line-through decoration-rose-400 dark:text-cyan-100">
                  {correction.original}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-cyan-800/80 dark:text-cyan-50/70">
                  → {correction.fixed}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
