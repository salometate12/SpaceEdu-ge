import { z } from "zod";
import type { ChemistryOpenCriterion } from "@/data/chemistryExamsData";

/**
 * Grader for the chemistry paper's open sub-items (31–40). Every chemistry
 * sub-item's criteria are additive (a formula, a name, a balanced equation, a
 * filled table cell or a calculation step is worth its stated points), so the
 * score is the sum of the met criteria — re-derived here, never trusted from a
 * number the model reports, exactly like the history/geography graders.
 */

export const ChemistryGradedCriterionSchema = z.object({
  id: z.string(),
  met: z.boolean(),
  comment: z.string().optional(),
});

export const ChemistryOpenGraderResponseSchema = z.object({
  summary: z.string(),
  criteria: z.array(ChemistryGradedCriterionSchema),
  whatWasMissing: z.string().optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
});

export type ChemistryOpenGraderResponse = z.infer<typeof ChemistryOpenGraderResponseSchema>;

export interface ChemistryOpenGraderReport extends ChemistryOpenGraderResponse {
  score: number;
}

export const ChemistryOpenGraderRequestSchema = z.object({
  subItemPrompt: z.string().min(1),
  taskContext: z.string().optional(),
  criteria: z.array(z.object({ id: z.string(), description: z.string(), points: z.number() })),
  modelAnswer: z.string().optional(),
  requiresCalculation: z.boolean().optional(),
  maxPoints: z.number(),
  studentAnswer: z.string().min(1),
});

export type ChemistryOpenGraderRequest = z.infer<typeof ChemistryOpenGraderRequestSchema>;

export function scoreFromChemistryCriteria(
  metIds: Set<string>,
  criteria: ChemistryOpenCriterion[],
  maxPoints: number,
): number {
  const earned = criteria.reduce((sum, c) => sum + (metIds.has(c.id) ? c.points : 0), 0);
  return Math.max(0, Math.min(maxPoints, earned));
}

export function normalizeChemistryOpenReport(
  report: ChemistryOpenGraderResponse,
  input: { criteria: ChemistryOpenCriterion[]; maxPoints: number },
): ChemistryOpenGraderReport {
  const byId = new Map(report.criteria.map((c) => [c.id, c]));
  const criteria = input.criteria.map((c) => {
    const found = byId.get(c.id);
    return { id: c.id, met: Boolean(found?.met), comment: found?.comment?.trim() || undefined };
  });
  const metIds = new Set(criteria.filter((c) => c.met).map((c) => c.id));
  const score = scoreFromChemistryCriteria(metIds, input.criteria, input.maxPoints);
  return {
    score,
    summary: report.summary,
    criteria,
    whatWasMissing: report.whatWasMissing?.trim() || undefined,
    correctAnswer: report.correctAnswer?.trim() || undefined,
    explanation: report.explanation?.trim() || undefined,
  };
}

export const CHEMISTRY_OPEN_JSON_INSTRUCTIONS = `Return ONLY valid JSON matching the schema.
You are a Georgian National Exams chemistry examiner. You are given the task context, the sub-item question, the scheme's creditable criteria (each with an id and its points), the scheme's model answer, and the student's answer.
For each criterion, decide whether the student GENUINELY met it. Judge chemistry by MEANING, not by surface form: accept a formula, name, structural formula or equation that is chemically equivalent to the model answer even if written differently (different but valid ordering, spacing or notation). For an equation, credit "balanced" only if it is actually balanced; when a criterion's description says an unbalanced-but-correct equation earns fewer points, follow that rule exactly. For a calculation, credit a step only if its result is chemically correct.
Do NOT compute the final numeric score yourself — the system derives it from the met criteria. Grade only on real chemistry, never invent facts.
In "correctAnswer" restate the scheme's expected answer; in "explanation" say briefly why it is correct; in "whatWasMissing" say what the answer lacked for full marks (omit if full marks).
Write every string field in natural Georgian.`;
