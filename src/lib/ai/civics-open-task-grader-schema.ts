import { z } from "zod";
import type { CivicsOpenCriterion } from "@/data/civicsExamsData";

/**
 * Grader for the civics paper's open sub-items (26–30, minus the client-side
 * MCQ and matching ones). Each sub-item's scheme criteria are additive (an
 * argument, a corrected error, a reasoning point is worth its stated points),
 * so the score is the sum of the met criteria — re-derived here, never trusted
 * from a number the model reports, like the history/geography graders.
 */

export const CivicsGradedCriterionSchema = z.object({
  id: z.string(),
  met: z.boolean(),
  comment: z.string().optional(),
});

export const CivicsOpenGraderResponseSchema = z.object({
  summary: z.string(),
  criteria: z.array(CivicsGradedCriterionSchema),
  whatWasMissing: z.string().optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
});

export type CivicsOpenGraderResponse = z.infer<typeof CivicsOpenGraderResponseSchema>;

export interface CivicsOpenGraderReport extends CivicsOpenGraderResponse {
  score: number;
}

export const CivicsOpenGraderRequestSchema = z.object({
  subItemPrompt: z.string().min(1),
  taskContext: z.string().optional(),
  sourceText: z.string().optional(),
  criteria: z.array(z.object({ id: z.string(), description: z.string(), points: z.number() })),
  modelAnswer: z.string().optional(),
  maxPoints: z.number(),
  studentAnswer: z.string().min(1),
});

export type CivicsOpenGraderRequest = z.infer<typeof CivicsOpenGraderRequestSchema>;

export function scoreFromCivicsCriteria(
  metIds: Set<string>,
  criteria: CivicsOpenCriterion[],
  maxPoints: number,
): number {
  const earned = criteria.reduce((sum, c) => sum + (metIds.has(c.id) ? c.points : 0), 0);
  return Math.max(0, Math.min(maxPoints, earned));
}

export function normalizeCivicsOpenReport(
  report: CivicsOpenGraderResponse,
  input: { criteria: CivicsOpenCriterion[]; maxPoints: number },
): CivicsOpenGraderReport {
  const byId = new Map(report.criteria.map((c) => [c.id, c]));
  const criteria = input.criteria.map((c) => {
    const found = byId.get(c.id);
    return { id: c.id, met: Boolean(found?.met), comment: found?.comment?.trim() || undefined };
  });
  const metIds = new Set(criteria.filter((c) => c.met).map((c) => c.id));
  const score = scoreFromCivicsCriteria(metIds, input.criteria, input.maxPoints);
  return {
    score,
    summary: report.summary,
    criteria,
    whatWasMissing: report.whatWasMissing?.trim() || undefined,
    correctAnswer: report.correctAnswer?.trim() || undefined,
    explanation: report.explanation?.trim() || undefined,
  };
}

export const CIVICS_OPEN_JSON_INSTRUCTIONS = `Return ONLY valid JSON matching the schema.
You are a Georgian National Exams civic-education examiner. You are given the task context, the sub-item question, the source text it is based on (when any), the scheme's creditable criteria (each with an id and its points), the scheme's model answer, and the student's answer.
For each criterion, decide whether the student GENUINELY met it — the point must be actually earned per the scheme, not merely restated. For an argument/reasoning criterion, credit it only if the point is concrete, on-topic and (when the task requires) grounded in the named source; independent arguments must be genuinely distinct. For an error-correction criterion, credit it only if the student identified that specific error AND gave the correct fix.
Never award a criterion for reasoning that contains hate speech or discriminatory views. Do NOT compute the final numeric score yourself — the system derives it from the met criteria. Grade honestly and strictly; never invent facts.
In "correctAnswer" restate the scheme's expected answer; in "explanation" say briefly why it is correct; in "whatWasMissing" say what the answer lacked for full marks (omit if full marks).
Write every string field in natural Georgian.`;
