"use client";

import { useCallback, useState } from "react";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { GeographyOpenGraderReport } from "@/lib/ai/geography-open-task-grader-schema";
import { localGradeGeographyOpen } from "@/lib/geography-open-task-grader-local";
import { recordToolUsage } from "@/lib/activity";
import type { GeographyOpenSubItem, GeographyOpenTask } from "@/data/geographyExamsData";

export interface GeographyOpenGradeOutcome {
  report: GeographyOpenGraderReport;
  usedFallback: boolean;
}

/**
 * Grades a single geography open sub-item against its scheme criteria — the bare
 * async call, with the local fallback and no React state. The exam grades every
 * open sub-item at the end by calling this once per answered sub-item (in
 * parallel), so nothing is scored mid-exam. MCQ sub-items never reach here.
 */
export async function gradeGeographyOpenSubItem(
  subItem: GeographyOpenSubItem,
  task: GeographyOpenTask,
  studentAnswer: string,
): Promise<GeographyOpenGradeOutcome> {
  const text = studentAnswer.trim();
  const criteria = subItem.criteria ?? [];
  const gradeInput = { criteria, maxPoints: subItem.maxPoints };
  try {
    const report = await fetchAiJson<GeographyOpenGraderReport>({
      pageType: "geography-open-task-grader",
      responseMode: "json",
      payload: {
        subItemPrompt: subItem.prompt,
        taskContext: task.instruction,
        sourceCaption: (task.figures ?? subItem.figures ?? [])
          .map((f) => f.caption || f.alt)
          .join("; ") || undefined,
        criteria,
        modelAnswer: subItem.modelAnswer,
        requiresCalculation: subItem.requiresCalculation,
        maxPoints: subItem.maxPoints,
        studentAnswer: text,
      },
    });
    return { report, usedFallback: false };
  } catch (error) {
    console.warn("geography open grader falling back to local estimate", error);
    return { report: localGradeGeographyOpen(text, gradeInput), usedFallback: true };
  }
}

export interface GeographyOpenGradingState {
  report: GeographyOpenGraderReport | null;
  busy: boolean;
  usedFallback: boolean;
  grade: (subItem: GeographyOpenSubItem, task: GeographyOpenTask, studentAnswer: string) => Promise<void>;
  reset: () => void;
}

/** React hook wrapper around `gradeGeographyOpenSubItem` (single sub-item). */
export function useGeographyOpenGrading(toolId = "abit-geography-open"): GeographyOpenGradingState {
  const [report, setReport] = useState<GeographyOpenGraderReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const grade = useCallback(
    async (subItem: GeographyOpenSubItem, task: GeographyOpenTask, studentAnswer: string) => {
      if (!studentAnswer.trim() || busy) return;
      setBusy(true);
      setReport(null);
      setUsedFallback(false);
      recordToolUsage(toolId, "გეოგრაფიის ღია დავალების შემფასებელი");
      try {
        const outcome = await gradeGeographyOpenSubItem(subItem, task, studentAnswer);
        setReport(outcome.report);
        setUsedFallback(outcome.usedFallback);
      } finally {
        setBusy(false);
      }
    },
    [busy, toolId],
  );

  const reset = useCallback(() => {
    setReport(null);
    setUsedFallback(false);
  }, []);

  return { report, busy, usedFallback, grade, reset };
}
