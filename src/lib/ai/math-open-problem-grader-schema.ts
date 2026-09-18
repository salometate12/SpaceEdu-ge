import { z } from "zod";
import type { MathScoringRow, MathOpenStep } from "@/data/mathExamsData";

/**
 * Grader for the maths paper's open problems (38–41). The model is handed the
 * problem, the official worked solution, the scheme's steps ("ამოხსნის ეტაპები")
 * and its scoring table ("შეფასების სქემა"), and judges which steps the student
 * actually completed. The final score is then read off the scoring table with
 * the exam's own logic — e.g. "1 ქულა - ა" means only step ა earns 1 point.
 */

export const MathGradedStepSchema = z.object({
  id: z.string(),
  done: z.boolean(),
  comment: z.string().optional(),
});

export const MathOpenGraderResponseSchema = z.object({
  score: z.number().min(0),
  summary: z.string(),
  steps: z.array(MathGradedStepSchema),
  /** Where the student went wrong and what the correct move was. */
  mistake: z.string().optional(),
  correctMove: z.string().optional(),
});

export type MathOpenGraderResponse = z.infer<typeof MathOpenGraderResponseSchema>;

export const MathOpenGraderRequestSchema = z.object({
  problemPrompt: z.string().min(1),
  modelSolution: z.string().min(1),
  answer: z.string().optional(),
  steps: z.array(z.object({ id: z.string(), description: z.string() })),
  scoringTable: z.array(z.object({ score: z.number(), requiresSteps: z.array(z.string()) })),
  partialCreditNote: z.string().optional(),
  maxPoints: z.number(),
  studentSolution: z.string().min(1),
});

export type MathOpenGraderRequest = z.infer<typeof MathOpenGraderRequestSchema>;

/**
 * Reads a score off the scoring table from the set of completed steps: the
 * highest row whose `requiresSteps` are all done. Falls back to 0.
 */
export function scoreFromSteps(
  completed: Set<string>,
  scoringTable: MathScoringRow[],
  maxPoints: number,
): number {
  let best = 0;
  for (const row of scoringTable) {
    if (row.requiresSteps.every((s) => completed.has(s))) {
      best = Math.max(best, row.score);
    }
  }
  return Math.max(0, Math.min(maxPoints, best));
}

/**
 * Rebuilds the report defensively: one entry per scheme step, and the score
 * re-derived from the completed steps through the scoring table (so a model
 * that reports an inconsistent number can't award phantom points).
 */
export function normalizeMathOpenReport(
  report: MathOpenGraderResponse,
  input: { steps: MathOpenStep[]; scoringTable: MathScoringRow[]; maxPoints: number },
): MathOpenGraderResponse {
  const doneById = new Map(report.steps.map((s) => [s.id, s]));
  const steps = input.steps.map((step) => {
    const found = doneById.get(step.id);
    return { id: step.id, done: Boolean(found?.done), comment: found?.comment?.trim() || undefined };
  });
  const completed = new Set(steps.filter((s) => s.done).map((s) => s.id));
  const score = scoreFromSteps(completed, input.scoringTable, input.maxPoints);
  return {
    score,
    summary: report.summary,
    steps,
    mistake: report.mistake?.trim() || undefined,
    correctMove: report.correctMove?.trim() || undefined,
  };
}

export const MATH_OPEN_JSON_INSTRUCTIONS = `Return ONLY valid JSON matching the schema.
You are a Georgian National Exam mathematics grader. You are given the problem, the official worked solution ("ამოხსნა"), the scheme's steps ("ამოხსნის ეტაპები", each with an id like ა/ბ/გ) and its scoring table, plus the student's solution.
For each step, decide whether the student genuinely completed it (mathematically correct, not just mentioned) and set "done" accordingly with a short Georgian comment.
Do NOT compute the final numeric score yourself — the system derives it from the completed steps via the scoring table. Just judge the steps honestly.
In "mistake" name the first real error (quote the student's step), and in "correctMove" give the correct next step. If the solution is fully correct, omit them.
Write every string field in natural Georgian.`;
