"use client";

import { useCallback, useState } from "react";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { MathOpenGraderResponse } from "@/lib/ai/math-open-problem-grader-schema";
import { localGradeMathOpen } from "@/lib/math-open-problem-grader-local";
import { recordToolUsage } from "@/lib/activity";
import type { MathOpenProblem } from "@/data/mathExamsData";

export interface MathOpenGradingState {
  result: MathOpenGraderResponse | null;
  busy: boolean;
  usedFallback: boolean;
  grade: (problem: MathOpenProblem, studentSolution: string) => Promise<void>;
  reset: () => void;
}

/** One graded open problem: its report plus whether the local fallback ran. */
export interface MathOpenGradeOutcome {
  result: MathOpenGraderResponse;
  usedFallback: boolean;
}

/**
 * Grades a single open problem against its scoring table — the bare async call,
 * with the local fallback, and no React state. The exam grades every open
 * problem at the end by calling this once per problem, so nothing is scored
 * mid-exam and the drafts can outlive the cards they were typed in.
 */
export async function gradeMathOpenProblem(
  problem: MathOpenProblem,
  studentSolution: string,
): Promise<MathOpenGradeOutcome> {
  const text = studentSolution.trim();
  const gradeInput = {
    steps: problem.steps,
    scoringTable: problem.scoringTable,
    maxPoints: problem.points,
  };
  try {
    const response = await fetchAiJson<MathOpenGraderResponse>({
      pageType: "math-open-problem-grader",
      responseMode: "json",
      payload: {
        problemPrompt: problem.prompt,
        modelSolution: problem.modelSolution,
        answer: problem.answer,
        steps: problem.steps,
        scoringTable: problem.scoringTable,
        partialCreditNote: problem.partialCreditNote,
        maxPoints: problem.points,
        studentSolution: text,
      },
    });
    return { result: response, usedFallback: false };
  } catch (error) {
    console.warn("math open grader falling back to local estimate", error);
    return { result: localGradeMathOpen(text, gradeInput), usedFallback: true };
  }
}

/** Step-by-step grading of a maths open problem against its scoring table. */
export function useMathOpenGrading(toolId = "abit-math-open"): MathOpenGradingState {
  const [result, setResult] = useState<MathOpenGraderResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const grade = useCallback(
    async (problem: MathOpenProblem, studentSolution: string) => {
      const text = studentSolution.trim();
      if (!text || busy) return;
      setBusy(true);
      setResult(null);
      setUsedFallback(false);
      recordToolUsage(toolId, "მათემატიკის ამოცანის შემფასებელი");

      try {
        const outcome = await gradeMathOpenProblem(problem, text);
        setResult(outcome.result);
        setUsedFallback(outcome.usedFallback);
      } finally {
        setBusy(false);
      }
    },
    [busy, toolId],
  );

  const reset = useCallback(() => {
    setResult(null);
    setUsedFallback(false);
  }, []);

  return { result, busy, usedFallback, grade, reset };
}
