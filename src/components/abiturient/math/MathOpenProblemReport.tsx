"use client";

import { Check, X } from "lucide-react";
import type { MathOpenProblem } from "@/data/mathExamsData";
import type { MathOpenGraderResponse } from "@/lib/ai/math-open-problem-grader-schema";

/**
 * The graded report for one maths open problem — score, the scheme steps with
 * ✓/✗, the first mistake and the correct move. Shared so the practice page and
 * (potentially) the exam results screen render the same thing.
 */
export function MathOpenProblemReport({
  problem,
  result,
  usedFallback,
}: {
  problem: MathOpenProblem;
  result: MathOpenGraderResponse;
  usedFallback?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-lg font-black text-slate-900 dark:text-white">
        {result.score}/{problem.points} ქულა
      </p>
      {usedFallback && (
        <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
          AI მიუწვდომელია — სავარაუდო ლოკალური შეფასება.
        </p>
      )}
      {result.summary && (
        <p className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-zinc-300">
          {result.summary}
        </p>
      )}
      <ul className="mt-3 space-y-1.5">
        {result.steps.map((s) => (
          <li key={s.id} className="flex items-start gap-2 text-[13px]">
            {s.done ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            ) : (
              <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
            )}
            <span className="text-slate-700 dark:text-zinc-300">
              {problem.steps.find((st) => st.id === s.id)?.description ?? s.id}
              {s.comment ? ` — ${s.comment}` : ""}
            </span>
          </li>
        ))}
      </ul>
      {result.mistake && (
        <p className="mt-3 text-[13px] text-rose-700 dark:text-rose-300">
          შეცდომა: {result.mistake}
        </p>
      )}
      {result.correctMove && (
        <p className="mt-1 text-[13px] text-emerald-700 dark:text-emerald-300">
          სწორი ნაბიჯი: {result.correctMove}
        </p>
      )}
    </div>
  );
}
