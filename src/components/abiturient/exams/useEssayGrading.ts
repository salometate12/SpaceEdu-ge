"use client";

import { useCallback, useState } from "react";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { EssayGraderResponse } from "@/lib/ai/essay-grader-schema";
import { localGradeEssay } from "@/lib/essay-grader-local";
import { recordQuestProgress } from "@/lib/daily-quests";
import { recordToolUsage } from "@/lib/activity";

export interface EssayGradingState {
  result: EssayGraderResponse | null;
  busy: boolean;
  /** True when the AI was unreachable and the local rubric answered. */
  usedFallback: boolean;
  grade: (essay: string, prompt?: string) => Promise<void>;
  reset: () => void;
}

/**
 * Grading shared by the standalone essay page and the in-exam writing
 * stage: one AI call, and a local rubric fallback so the student is never
 * left without a scored report.
 */
export function useEssayGrading(toolId = "abit-essay-grader"): EssayGradingState {
  const [result, setResult] = useState<EssayGraderResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const grade = useCallback(
    async (essay: string, prompt?: string) => {
      const text = essay.trim();
      if (!text || busy) return;
      setBusy(true);
      setResult(null);
      setUsedFallback(false);
      recordToolUsage(toolId, "ესეს შემფასებელი");

      try {
        const response = await fetchAiJson<EssayGraderResponse>({
          pageType: "essay-grader",
          responseMode: "json",
          payload: { essay: text, prompt: prompt?.trim() || undefined },
        });
        setResult(response);
      } catch (error) {
        console.warn("essay grader falling back to local rubric", error);
        setResult(localGradeEssay(text, prompt?.trim() || undefined));
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
