"use client";

import { useCallback, useState } from "react";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { HistoryOpenGraderReport } from "@/lib/ai/history-open-answer-grader-schema";
import { localGradeHistoryOpen } from "@/lib/history-open-answer-grader-local";
import { recordToolUsage } from "@/lib/activity";
import type { HistoryOpenSubItem } from "@/data/historyExamsData";

export interface HistoryOpenGradeOutcome {
  report: HistoryOpenGraderReport;
  usedFallback: boolean;
}

/**
 * Grades a single history open sub-item against its scheme criteria — the bare
 * async call, with the local fallback, and no React state. The exam grades
 * every sub-item at the end by calling this once per answered sub-item (in
 * parallel), so nothing is scored mid-exam and the drafts can outlive the
 * cards they were typed in.
 */
export async function gradeHistoryOpenAnswer(
  subItem: HistoryOpenSubItem,
  sourceDocumentText: string | undefined,
  studentAnswer: string,
): Promise<HistoryOpenGradeOutcome> {
  const text = studentAnswer.trim();
  const gradeInput = { criteria: subItem.criteria, maxPoints: subItem.maxPoints };
  try {
    const report = await fetchAiJson<HistoryOpenGraderReport>({
      pageType: "history-open-answer-grader",
      responseMode: "json",
      payload: {
        subItemPrompt: subItem.prompt,
        criteria: subItem.criteria,
        noCreditNotes: subItem.noCreditNotes,
        sourceDocumentText,
        maxPoints: subItem.maxPoints,
        studentAnswer: text,
      },
    });
    return { report, usedFallback: false };
  } catch (error) {
    console.warn("history open grader falling back to local estimate", error);
    return { report: localGradeHistoryOpen(text, gradeInput), usedFallback: true };
  }
}

export interface HistoryOpenGradingState {
  report: HistoryOpenGraderReport | null;
  busy: boolean;
  usedFallback: boolean;
  grade: (
    subItem: HistoryOpenSubItem,
    sourceDocumentText: string | undefined,
    studentAnswer: string,
  ) => Promise<void>;
  reset: () => void;
}

/** React hook wrapper around `gradeHistoryOpenAnswer` (single sub-item). */
export function useHistoryOpenGrading(toolId = "abit-history-open"): HistoryOpenGradingState {
  const [report, setReport] = useState<HistoryOpenGraderReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const grade = useCallback(
    async (
      subItem: HistoryOpenSubItem,
      sourceDocumentText: string | undefined,
      studentAnswer: string,
    ) => {
      if (!studentAnswer.trim() || busy) return;
      setBusy(true);
      setReport(null);
      setUsedFallback(false);
      recordToolUsage(toolId, "ისტორიის ღია დავალების შემფასებელი");
      try {
        const outcome = await gradeHistoryOpenAnswer(subItem, sourceDocumentText, studentAnswer);
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
