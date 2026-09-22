"use client";

import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { ChemistryOpenGraderReport } from "@/lib/ai/chemistry-open-task-grader-schema";
import { localGradeChemistryOpen } from "@/lib/chemistry-open-task-grader-local";
import type { ChemistryOpenSubItem, ChemistryOpenTask } from "@/data/chemistryExamsData";

export interface ChemistryOpenGradeOutcome {
  report: ChemistryOpenGraderReport;
  usedFallback: boolean;
}

/**
 * Grades a single chemistry open sub-item against its scheme criteria — the bare
 * async call with the local fallback. The exam grades every answered sub-item at
 * the end, in parallel.
 */
export async function gradeChemistryOpenSubItem(
  subItem: ChemistryOpenSubItem,
  task: ChemistryOpenTask,
  studentAnswer: string,
): Promise<ChemistryOpenGradeOutcome> {
  const text = studentAnswer.trim();
  const gradeInput = { criteria: subItem.criteria, maxPoints: subItem.maxPoints };
  try {
    const report = await fetchAiJson<ChemistryOpenGraderReport>({
      pageType: "chemistry-open-task-grader",
      responseMode: "json",
      payload: {
        subItemPrompt: subItem.prompt,
        taskContext: task.instruction,
        criteria: subItem.criteria,
        modelAnswer: subItem.modelAnswer,
        requiresCalculation: subItem.requiresCalculation,
        maxPoints: subItem.maxPoints,
        studentAnswer: text,
      },
    });
    return { report, usedFallback: false };
  } catch (error) {
    console.warn("chemistry open grader falling back to local estimate", error);
    return { report: localGradeChemistryOpen(text, gradeInput), usedFallback: true };
  }
}
