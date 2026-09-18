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

/** Step-by-step grading of a maths open problem against its scoring table. */
export function useMathOpenGrading(toolId = "abit-math-open"): MathOpenGradingState {
  const [result, setResult] = useState<MathOpenGraderResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const grade = useCallback(
    async (problem: MathOpenProblem, studentSolution: string) => {
      const text = studentSolution.trim();
      if (!text || busy) return;
      const gradeInput = {
        steps: problem.steps,
        scoringTable: problem.scoringTable,
        maxPoints: problem.points,
      };
      setBusy(true);
      setResult(null);
      setUsedFallback(false);
      recordToolUsage(toolId, "მათემატიკის ამოცანის შემფასებელი");

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
        setResult(response);
      } catch (error) {
        console.warn("math open grader falling back to local estimate", error);
        setResult(localGradeMathOpen(text, gradeInput));
        setUsedFallback(true);
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
