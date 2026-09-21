"use client";

import { Check, Sparkles } from "lucide-react";
import {
  ENGLISH_WRITING_CRITERION_LABELS,
  ENGLISH_WRITING_CRITERION_MAX,
  ENGLISH_WRITING_TOTAL_MAX,
  type EnglishWritingCriterionId,
  type EnglishWritingGraderResponse,
} from "@/lib/ai/english-writing-task-grader-schema";

/** The graded report for the English Task 7 essay — score, the four criteria,
 *  strengths and concrete corrections. Shared by the exam and the practice. */
export function EnglishWritingReport({
  result,
  usedFallback,
}: {
  result: EnglishWritingGraderResponse;
  usedFallback?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-lg font-black text-slate-900 dark:text-white">
        {result.totalScore}/{ENGLISH_WRITING_TOTAL_MAX} points
      </p>
      {usedFallback && (
        <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
          AI unavailable — rough local estimate.
        </p>
      )}
      {result.summary && (
        <p className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-zinc-300">
          {result.summary}
        </p>
      )}

      <div className="mt-3 space-y-2">
        {result.criteria.map((c) => {
          const max = ENGLISH_WRITING_CRITERION_MAX[c.id as EnglishWritingCriterionId];
          return (
            <div
              key={c.id}
              className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#121214]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                  {c.id}. {ENGLISH_WRITING_CRITERION_LABELS[c.id as EnglishWritingCriterionId]}
                </span>
                <span className="text-[13px] font-bold tabular-nums text-slate-900 dark:text-white">
                  {c.score} / {max}
                </span>
              </div>
              {c.comment && (
                <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600 dark:text-zinc-300">
                  {c.comment}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {result.strengths.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3 w-3 stroke-[2.5]" /> Strengths
          </p>
          <ul className="space-y-1">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-slate-700 dark:text-zinc-300">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.corrections.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Corrections
          </p>
          <ul className="space-y-1.5">
            {result.corrections.map((c, i) => (
              <li key={i} className="text-[13px] leading-relaxed">
                <span className="text-rose-700 line-through dark:text-rose-300">{c.issue}</span>{" "}
                <span className="text-emerald-700 dark:text-emerald-300">→ {c.fix}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
