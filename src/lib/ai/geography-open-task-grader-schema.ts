import { z } from "zod";
import type { GeographyOpenCriterion } from "@/data/geographyExamsData";

/**
 * Grader for the geography paper's open sub-items (28.3, 29, 31.x, 32, 33.x,
 * 34.x, 35.2, 35.3, 36.x, 37.3–37.5). The model is handed the sub-item's
 * question, the source(s) it is based on (a caption naming the map/chart/photo),
 * the scheme's creditable criteria (each with an id and its point value, taken
 * verbatim from the scoring PDF) and the student's answer. It decides, per
 * criterion, whether the student genuinely met it — and the final score is
 * DERIVED from the met criteria (never trusted from a number the model reports),
 * exactly like the history and maths graders. The MCQ sub-items (28.1, 28.2,
 * 35.1, 37.1, 37.2) are graded client-side and never reach this grader.
 */

export const GeographyGradedCriterionSchema = z.object({
  id: z.string(),
  met: z.boolean(),
  comment: z.string().optional(),
});

export const GeographyOpenGraderResponseSchema = z.object({
  summary: z.string(),
  criteria: z.array(GeographyGradedCriterionSchema),
  whatWasMissing: z.string().optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
});

export type GeographyOpenGraderResponse = z.infer<typeof GeographyOpenGraderResponseSchema>;

/** The report the UI renders — the response plus the derived score. */
export interface GeographyOpenGraderReport extends GeographyOpenGraderResponse {
  score: number;
}

export const GeographyOpenGraderRequestSchema = z.object({
  subItemPrompt: z.string().min(1),
  taskContext: z.string().optional(),
  sourceCaption: z.string().optional(),
  criteria: z.array(
    z.object({ id: z.string(), description: z.string(), points: z.number() }),
  ),
  modelAnswer: z.string().optional(),
  requiresCalculation: z.boolean().optional(),
  maxPoints: z.number(),
  studentAnswer: z.string().min(1),
});

export type GeographyOpenGraderRequest = z.infer<typeof GeographyOpenGraderRequestSchema>;

/** Score = sum of the met criteria's points, capped at the sub-item maximum. */
export function scoreFromGeographyCriteria(
  metIds: Set<string>,
  criteria: GeographyOpenCriterion[],
  maxPoints: number,
): number {
  const earned = criteria.reduce((sum, c) => sum + (metIds.has(c.id) ? c.points : 0), 0);
  return Math.max(0, Math.min(maxPoints, earned));
}

/**
 * Rebuilds the report defensively: one entry per scheme criterion, and the
 * score re-derived from the met criteria — so a model that reports an
 * inconsistent number can't award phantom points.
 */
export function normalizeGeographyOpenReport(
  report: GeographyOpenGraderResponse,
  input: { criteria: GeographyOpenCriterion[]; maxPoints: number },
): GeographyOpenGraderReport {
  const byId = new Map(report.criteria.map((c) => [c.id, c]));
  const criteria = input.criteria.map((c) => {
    const found = byId.get(c.id);
    return { id: c.id, met: Boolean(found?.met), comment: found?.comment?.trim() || undefined };
  });
  const metIds = new Set(criteria.filter((c) => c.met).map((c) => c.id));
  const score = scoreFromGeographyCriteria(metIds, input.criteria, input.maxPoints);
  return {
    score,
    summary: report.summary,
    criteria,
    whatWasMissing: report.whatWasMissing?.trim() || undefined,
    correctAnswer: report.correctAnswer?.trim() || undefined,
    explanation: report.explanation?.trim() || undefined,
  };
}

export const GEOGRAPHY_OPEN_JSON_INSTRUCTIONS = `Return ONLY valid JSON matching the schema.
You are a Georgian National Exams geography examiner. You are given the sub-item question, the task's shared context, a caption naming the source it is based on (a map, chart, diagram or photo), the scheme's creditable criteria (each with an id and its points), the scheme's model answer, and the student's answer.
For each criterion, decide whether the student GENUINELY met it — the point must be actually earned per the scheme, not merely mentioned or restated. When a criterion is a source-based explanation, credit it only if the student's reasoning genuinely reflects the named source. When the sub-item requires a calculation, credit it only if the numeric result is correct (a correct method with a wrong final number does not earn the point unless the scheme says so). Set "met" accordingly with a short Georgian comment.
Do NOT compute the final numeric score yourself — the system derives it from the met criteria. Judge honestly and strictly; grade only on real geography, never invent facts.
In "correctAnswer" restate the scheme's expected answer; in "explanation" say briefly why it is correct; in "whatWasMissing" say what the answer lacked for full marks (omit if full marks).
Write every string field in natural Georgian.`;
