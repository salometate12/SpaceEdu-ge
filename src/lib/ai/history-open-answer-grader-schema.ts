import { z } from "zod";
import type { HistoryOpenCriterion } from "@/data/historyExamsData";

/**
 * Grader for the history paper's open sub-items (37.x, 38.x). The model is
 * handed the sub-item's question, the source-document text it is based on, the
 * scheme's creditable criteria (each with an id and its point value, taken
 * verbatim from the scoring PDF) and any "does not earn credit if…" notes, plus
 * the student's answer. It decides, per criterion, whether the student genuinely
 * met it — and the final score is DERIVED from the met criteria (never trusted
 * from a number the model reports), exactly like the maths grader.
 */

export const HistoryGradedCriterionSchema = z.object({
  id: z.string(),
  met: z.boolean(),
  comment: z.string().optional(),
});

export const HistoryOpenGraderResponseSchema = z.object({
  summary: z.string(),
  criteria: z.array(HistoryGradedCriterionSchema),
  /** What the answer was missing to earn full marks. */
  whatWasMissing: z.string().optional(),
  /** The expected key point(s), grounded in the source when relevant. */
  correctAnswer: z.string().optional(),
  /** Why that answer is the correct one. */
  explanation: z.string().optional(),
});

export type HistoryOpenGraderResponse = z.infer<typeof HistoryOpenGraderResponseSchema>;

/** The report the UI renders — the response plus the derived score. */
export interface HistoryOpenGraderReport extends HistoryOpenGraderResponse {
  score: number;
}

export const HistoryOpenGraderRequestSchema = z.object({
  subItemPrompt: z.string().min(1),
  criteria: z.array(
    z.object({ id: z.string(), description: z.string(), points: z.number() }),
  ),
  noCreditNotes: z.array(z.string()).optional(),
  sourceDocumentText: z.string().optional(),
  maxPoints: z.number(),
  studentAnswer: z.string().min(1),
});

export type HistoryOpenGraderRequest = z.infer<typeof HistoryOpenGraderRequestSchema>;

/**
 * Score = sum of the met criteria's points, capped at the sub-item maximum.
 * The scheme awards each criterion independently (e.g. 38.7 gives one point per
 * named cause), so summing met criteria matches the official logic.
 */
export function scoreFromCriteria(
  metIds: Set<string>,
  criteria: HistoryOpenCriterion[],
  maxPoints: number,
): number {
  const earned = criteria.reduce(
    (sum, c) => sum + (metIds.has(c.id) ? c.points : 0),
    0,
  );
  return Math.max(0, Math.min(maxPoints, earned));
}

/**
 * Rebuilds the report defensively: one entry per scheme criterion, and the
 * score re-derived from the met criteria — so a model that reports an
 * inconsistent number can't award phantom points.
 */
export function normalizeHistoryOpenReport(
  report: HistoryOpenGraderResponse,
  input: { criteria: HistoryOpenCriterion[]; maxPoints: number },
): HistoryOpenGraderReport {
  const byId = new Map(report.criteria.map((c) => [c.id, c]));
  const criteria = input.criteria.map((c) => {
    const found = byId.get(c.id);
    return { id: c.id, met: Boolean(found?.met), comment: found?.comment?.trim() || undefined };
  });
  const metIds = new Set(criteria.filter((c) => c.met).map((c) => c.id));
  const score = scoreFromCriteria(metIds, input.criteria, input.maxPoints);
  return {
    score,
    summary: report.summary,
    criteria,
    whatWasMissing: report.whatWasMissing?.trim() || undefined,
    correctAnswer: report.correctAnswer?.trim() || undefined,
    explanation: report.explanation?.trim() || undefined,
  };
}

export const HISTORY_OPEN_JSON_INSTRUCTIONS = `Return ONLY valid JSON matching the schema.
You are a Georgian National Exams history examiner. You are given the sub-item question, the source-document text it is based on (when any), the scheme's creditable criteria (each with an id and its points) and any "does not earn credit if…" notes, plus the student's answer.
For each criterion, decide whether the student GENUINELY met it — the point must be actually earned per the scheme, not merely mentioned or restated. Respect every "does not earn credit" note strictly (e.g. a bare label with no argument earns nothing). Set "met" accordingly with a short Georgian comment.
Do NOT compute the final numeric score yourself — the system derives it from the met criteria. Judge honestly and strictly; grade only on facts, never invent history.
In "correctAnswer" state the expected key point(s) grounded in the source; in "explanation" say briefly why that is correct; in "whatWasMissing" say what the answer lacked for full marks (omit if full marks).
Write every string field in natural Georgian.`;
