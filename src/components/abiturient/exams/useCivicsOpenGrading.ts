"use client";

import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { CivicsOpenGraderReport } from "@/lib/ai/civics-open-task-grader-schema";
import { localGradeCivicsOpen } from "@/lib/civics-open-task-grader-local";
import type { CivicsOpenSubItem, CivicsOpenTask } from "@/data/civicsExamsData";

export interface CivicsOpenGradeOutcome {
  report: CivicsOpenGraderReport;
  usedFallback: boolean;
}

/** Grades a single civics open sub-item against its criteria — bare async call
 *  with the local fallback. The exam grades every answered sub-item at the end. */
export async function gradeCivicsOpenSubItem(
  subItem: CivicsOpenSubItem,
  task: CivicsOpenTask,
  studentAnswer: string,
): Promise<CivicsOpenGradeOutcome> {
  const text = studentAnswer.trim();
  const criteria = subItem.criteria ?? [];
  const gradeInput = { criteria, maxPoints: subItem.maxPoints };
  try {
    const report = await fetchAiJson<CivicsOpenGraderReport>({
      pageType: "civics-open-task-grader",
      responseMode: "json",
      payload: {
        subItemPrompt: subItem.prompt,
        taskContext: task.instruction,
        sourceText: (task.sourceTexts ?? []).map((s) => `${s.label}${s.attribution ? " (" + s.attribution + ")" : ""}: ${s.text ?? ""}`).join("\n\n") || undefined,
        criteria,
        modelAnswer: subItem.modelAnswer,
        maxPoints: subItem.maxPoints,
        studentAnswer: text,
      },
    });
    return { report, usedFallback: false };
  } catch (error) {
    console.warn("civics open grader falling back to local estimate", error);
    return { report: localGradeCivicsOpen(text, gradeInput), usedFallback: true };
  }
}
