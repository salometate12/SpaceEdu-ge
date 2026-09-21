import { z } from "zod";

/**
 * Grader for the English paper's Task 7 essay (16 points, 120–170 words).
 *
 * The exam publishes no official essay rubric, so this is a SpaceEdu-authored
 * one, confirmed with the user: four criteria summing to 16 —
 *   I.  Content & Task Achievement — 5
 *   II. Organisation & Cohesion — 4
 *   III. Range & Accuracy of Language — 5
 *   IV. Register & Tone — 2
 * As with the Georgian writing grader, the total is re-derived from the parts
 * so a model that reports an inconsistent number can't award phantom points.
 */

export const ENGLISH_WRITING_CRITERION_IDS = ["I", "II", "III", "IV"] as const;
export type EnglishWritingCriterionId = (typeof ENGLISH_WRITING_CRITERION_IDS)[number];

export const ENGLISH_WRITING_TOTAL_MAX = 16;

export const ENGLISH_WRITING_CRITERION_LABELS: Record<EnglishWritingCriterionId, string> = {
  I: "Content & Task Achievement",
  II: "Organisation & Cohesion",
  III: "Range & Accuracy of Language",
  IV: "Register & Tone",
};

export const ENGLISH_WRITING_CRITERION_MAX: Record<EnglishWritingCriterionId, number> = {
  I: 5,
  II: 4,
  III: 5,
  IV: 2,
};

export const EnglishWritingCriterionScoreSchema = z.object({
  id: z.enum(ENGLISH_WRITING_CRITERION_IDS),
  score: z.number().min(0),
  comment: z.string(),
});

export const EnglishWritingCorrectionSchema = z.object({
  issue: z.string(),
  fix: z.string(),
});

export const EnglishWritingGraderRequestSchema = z.object({
  essay: z.string().min(1),
  prompt: z.string().optional(),
  minWords: z.number().optional(),
  maxWords: z.number().optional(),
});

export type EnglishWritingGraderRequest = z.infer<typeof EnglishWritingGraderRequestSchema>;

/** Loose on cardinality on purpose — `normalize…` guarantees the UI's shape. */
export const EnglishWritingGraderResponseSchema = z.object({
  totalScore: z.number().min(0).max(ENGLISH_WRITING_TOTAL_MAX),
  summary: z.string(),
  criteria: z.array(EnglishWritingCriterionScoreSchema),
  strengths: z.array(z.string()),
  corrections: z.array(EnglishWritingCorrectionSchema),
});

export type EnglishWritingGraderResponse = z.infer<typeof EnglishWritingGraderResponseSchema>;
export type EnglishWritingCriterionScore = z.infer<typeof EnglishWritingCriterionScoreSchema>;

/**
 * Guarantees exactly one entry per criterion, clamped to its maximum, with the
 * total re-derived from the parts. A missing criterion falls back to a mid
 * score rather than dropping a row.
 */
export function normalizeEnglishWritingReport(
  report: EnglishWritingGraderResponse,
): EnglishWritingGraderResponse {
  const byId = new Map(report.criteria.map((item) => [item.id, item]));
  const criteria = ENGLISH_WRITING_CRITERION_IDS.map((id) => {
    const max = ENGLISH_WRITING_CRITERION_MAX[id];
    const found = byId.get(id);
    const fallback = Math.round(max / 2);
    return {
      id,
      score: Math.max(0, Math.min(max, Math.round(found?.score ?? fallback))),
      comment: found?.comment?.trim() || "No detailed comment was generated for this criterion.",
    };
  });
  return {
    totalScore: criteria.reduce((sum, item) => sum + item.score, 0),
    summary: report.summary,
    criteria,
    strengths: report.strengths.filter(Boolean).slice(0, 5),
    corrections: report.corrections.filter((c) => c.issue && c.fix).slice(0, 8),
  };
}

/** System-prompt-ready description of the rubric. */
export function englishWritingRubricText(): string {
  const lines = ENGLISH_WRITING_CRITERION_IDS.map(
    (id) =>
      `${id}. ${ENGLISH_WRITING_CRITERION_LABELS[id]} — 0-${ENGLISH_WRITING_CRITERION_MAX[id]}`,
  );
  return [
    `English essay rubric (Task 7, ${ENGLISH_WRITING_TOTAL_MAX} points total, 4 criteria):`,
    ...lines,
  ].join("\n");
}

export const ENGLISH_WRITING_JSON_INSTRUCTIONS = `Return ONLY valid JSON matching the schema.
You are grading a Georgian National Exam English Task 7 essay (16 points, 120–170 words) against the four SpaceEdu criteria (I–IV) given in the rubric, each with its own 0-N maximum.
Score every criterion on its own scale; be calibrated and strict — an average school essay lands well below the maximum, and a very short (well under 120 words) or off-topic essay must lose Content marks.
totalScore MUST equal the sum of the four criterion scores.
Write "summary", each criterion "comment" and "strengths" in clear English.
"corrections" must be concrete: put the student's actual weak/incorrect phrase in "issue" and the corrected English in "fix". Do not invent errors that are not in the essay.`;
