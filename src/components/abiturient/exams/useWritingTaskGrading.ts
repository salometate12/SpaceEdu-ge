"use client";

import { useCallback, useState } from "react";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { WritingTaskGraderResponse } from "@/lib/ai/writing-task-grader-schema";
import { localGradeWritingTask } from "@/lib/writing-task-grader-local";
import { recordQuestProgress } from "@/lib/daily-quests";
import { recordToolUsage } from "@/lib/activity";

export interface WritingTaskGradeInput {
  prompt?: string;
  /** Exam year — selects the correct year's 34-point rubric. */
  year?: number;
  passageTitle?: string;
  passageText?: string;
  hasBoundText?: boolean;
}

export interface WritingTaskGradingState {
  result: WritingTaskGraderResponse | null;
  busy: boolean;
  usedFallback: boolean;
  grade: (essay: string, input?: WritingTaskGradeInput) => Promise<void>;
  reset: () => void;
}

/**
 * Grading for the Georgian National Exam Part II essay ("წერითი დავალება", 34
 * points): one AI call against that year's 10-criterion rubric, with a local
 * fallback so the student always gets a scored report.
 */
export function useWritingTaskGrading(toolId = "abit-writing-task"): WritingTaskGradingState {
  const [result, setResult] = useState<WritingTaskGraderResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const grade = useCallback(
    async (essay: string, input: WritingTaskGradeInput = {}) => {
      const text = essay.trim();
      if (!text || busy) return;
      const year = input.year ?? 2025;
      const hasBoundText =
        typeof input.hasBoundText === "boolean" ? input.hasBoundText : Boolean(input.passageText);
      setBusy(true);
      setResult(null);
      setUsedFallback(false);
      recordToolUsage(toolId, "წერითი დავალების შემფასებელი");

      try {
        const response = await fetchAiJson<WritingTaskGraderResponse>({
          pageType: "writing-task-grader",
          responseMode: "json",
          payload: {
            essay: text,
            prompt: input.prompt?.trim() || undefined,
            year,
            passageTitle: input.passageTitle?.trim() || undefined,
            passageText: input.passageText?.trim() || undefined,
            hasBoundText,
          },
        });
        setResult(response);
      } catch (error) {
        console.warn("writing-task grader falling back to local rubric", error);
        setResult(localGradeWritingTask(text, { year, hasBoundText, prompt: input.prompt }));
        setUsedFallback(true);
      } finally {
        setBusy(false);
        recordQuestProgress("write-essay", 1);
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
