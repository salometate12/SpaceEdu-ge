"use client";

import { useCallback, useState } from "react";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { TextEditingGraderResponse } from "@/lib/ai/text-editing-grader-schema";
import { localGradeTextEditing } from "@/lib/text-editing-grader-local";
import { recordToolUsage } from "@/lib/activity";

export interface TextEditingGradingState {
  result: TextEditingGraderResponse | null;
  busy: boolean;
  usedFallback: boolean;
  grade: (source: string, corrected: string, year?: number) => Promise<void>;
  reset: () => void;
}

/**
 * Real grading for the Part I "ტექსტის რედაქტირება" task: one AI call against
 * that year's 16-point, 3-criterion rubric, comparing the student's corrected
 * version to the source, with a local fallback. Replaces the old length-only
 * heuristic that pretended to be an AI call.
 */
export function useTextEditingGrading(toolId = "abit-text-editing"): TextEditingGradingState {
  const [result, setResult] = useState<TextEditingGraderResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const grade = useCallback(
    async (source: string, corrected: string, year = 2025) => {
      const src = source.trim();
      const out = corrected.trim();
      if (!src || !out || busy) return;
      setBusy(true);
      setResult(null);
      setUsedFallback(false);
      recordToolUsage(toolId, "ტექსტის რედაქტირების შემფასებელი");

      try {
        const response = await fetchAiJson<TextEditingGraderResponse>({
          pageType: "text-editing-grader",
          responseMode: "json",
          payload: { source: src, corrected: out, year },
        });
        setResult(response);
      } catch (error) {
        console.warn("text-editing grader falling back to local rubric", error);
        setResult(localGradeTextEditing(src, out, year));
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
