"use client";

import { useCallback, useState } from "react";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { EnglishWritingGraderResponse } from "@/lib/ai/english-writing-task-grader-schema";
import { localGradeEnglishWriting } from "@/lib/english-writing-task-grader-local";
import { recordQuestProgress } from "@/lib/daily-quests";
import { recordToolUsage } from "@/lib/activity";

export interface EnglishWritingGradeInput {
  prompt?: string;
  minWords?: number;
  maxWords?: number;
}

export interface EnglishWritingGradingState {
  result: EnglishWritingGraderResponse | null;
  busy: boolean;
  usedFallback: boolean;
  grade: (essay: string, input?: EnglishWritingGradeInput) => Promise<void>;
  reset: () => void;
}

/**
 * Grading for the English Task 7 essay (16 points): one AI call against the
 * SpaceEdu 4-criterion rubric, with a local fallback so the student always
 * gets a scored report.
 */
export function useEnglishWritingGrading(
  toolId = "abit-english-writing",
): EnglishWritingGradingState {
  const [result, setResult] = useState<EnglishWritingGraderResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const grade = useCallback(
    async (essay: string, input: EnglishWritingGradeInput = {}) => {
      const text = essay.trim();
      if (!text || busy) return;
      setBusy(true);
      setResult(null);
      setUsedFallback(false);
      recordToolUsage(toolId, "ინგლისურის წერითი დავალების შემფასებელი");

      try {
        const response = await fetchAiJson<EnglishWritingGraderResponse>({
          pageType: "english-writing-task-grader",
          responseMode: "json",
          payload: {
            essay: text,
            prompt: input.prompt?.trim() || undefined,
            minWords: input.minWords,
            maxWords: input.maxWords,
          },
        });
        setResult(response);
      } catch (error) {
        console.warn("english writing grader falling back to local estimate", error);
        setResult(localGradeEnglishWriting(text, { minWords: input.minWords }));
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
