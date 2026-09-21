import { z } from "zod";

/**
 * Grader for the English paper's Task 7 essay (16 points, 120–170 words).
 *
 * Official rubric — four equal criteria, 4 points each (16 total):
 *   I.  Content / Task Fulfillment — 4
 *   II. Organization & Cohesion — 4
 *   III. Vocabulary / Lexical Resource — 4
 *   IV. Grammar & Spelling — 4
 * Official rules: an essay under 120 words loses marks; under 100 words is not
 * graded at all (0); an essay that does not address the topic scores 0 for the
 * whole task. As with the Georgian writing grader, the total is re-derived from
 * the parts so a model that reports an inconsistent number can't award phantom
 * points.
 */

export const ENGLISH_WRITING_CRITERION_IDS = ["I", "II", "III", "IV"] as const;
export type EnglishWritingCriterionId = (typeof ENGLISH_WRITING_CRITERION_IDS)[number];

export const ENGLISH_WRITING_TOTAL_MAX = 16;

/** Below this the essay is not graded at all (0). */
export const ENGLISH_WRITING_MIN_GRADED_WORDS = 100;
/** Below this (but at least the graded minimum) the essay loses marks. */
export const ENGLISH_WRITING_MIN_FULL_WORDS = 120;

export const ENGLISH_WRITING_CRITERION_LABELS: Record<EnglishWritingCriterionId, string> = {
  I: "Content / Task Fulfillment",
  II: "Organization & Cohesion",
  III: "Vocabulary / Lexical Resource",
  IV: "Grammar & Spelling",
};

export const ENGLISH_WRITING_CRITERION_MAX: Record<EnglishWritingCriterionId, number> = {
  I: 4,
  II: 4,
  III: 4,
  IV: 4,
};

/** Counts words the way the word-count rules do. */
export function englishEssayWordCount(essay: string): number {
  const t = essay.trim();
  return t ? t.split(/\s+/).filter(Boolean).length : 0;
}

/** An all-zero report — for an essay too short (<100 words) or off-topic. */
export function zeroEnglishWritingReport(summary: string): EnglishWritingGraderResponse {
  return {
    totalScore: 0,
    summary,
    criteria: ENGLISH_WRITING_CRITERION_IDS.map((id) => ({
      id,
      score: 0,
      comment: summary,
    })),
    strengths: [],
    corrections: [],
  };
}

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
  const descriptions: Record<EnglishWritingCriterionId, string> = {
    I: "does the essay answer the prompt, argue its point, and give examples (120–170 words)",
    II: "paragraph structure (intro / body / conclusion) and use of linking words",
    III: "range and precision of vocabulary, topic-specific words, collocations",
    IV: "grammatical accuracy, variety of structures, spelling and punctuation",
  };
  const lines = ENGLISH_WRITING_CRITERION_IDS.map(
    (id) =>
      `${id}. ${ENGLISH_WRITING_CRITERION_LABELS[id]} — 0-${ENGLISH_WRITING_CRITERION_MAX[id]} (${descriptions[id]})`,
  );
  return [
    `English essay rubric (Task 7, ${ENGLISH_WRITING_TOTAL_MAX} points total, 4 equal criteria of ${ENGLISH_WRITING_CRITERION_MAX.I} each):`,
    ...lines,
    `Rules: an essay of ${ENGLISH_WRITING_MIN_GRADED_WORDS}–${ENGLISH_WRITING_MIN_FULL_WORDS - 1} words loses marks; an essay under ${ENGLISH_WRITING_MIN_GRADED_WORDS} words is not graded (0); an off-topic essay scores 0 for the whole task.`,
  ].join("\n");
}

export const ENGLISH_WRITING_JSON_INSTRUCTIONS = `Return ONLY valid JSON matching the schema.
You are grading a Georgian National Exam English Task 7 essay (16 points, 120–170 words) against the four official criteria (I–IV) in the rubric, each scored 0-4:
I. Content / Task Fulfillment — does it address the prompt, argue the point, give examples, and meet the 120–170 word length.
II. Organization & Cohesion — clear paragraph structure (introduction / body / conclusion) and linking words.
III. Vocabulary / Lexical Resource — range and precision of vocabulary, topic-specific words, collocations.
IV. Grammar & Spelling — grammatical accuracy, variety of structures, spelling and punctuation.
Be calibrated and strict — an average school essay lands well below the maximum on every criterion.
Apply the length and topic rules exactly:
- If the essay is off-topic (does not address the given prompt at all), give 0 to ALL FOUR criteria.
- If the essay has fewer than ${ENGLISH_WRITING_MIN_GRADED_WORDS} words, give 0 to ALL FOUR criteria (it is not graded).
- If the essay has ${ENGLISH_WRITING_MIN_GRADED_WORDS}–${ENGLISH_WRITING_MIN_FULL_WORDS - 1} words (below the required 120), it must lose marks — lower criterion I in particular and note the shortfall.
totalScore MUST equal the sum of the four criterion scores.
Write "summary", each criterion "comment" and "strengths" in clear English.
"corrections" must be concrete: put the student's actual weak/incorrect phrase in "issue" and the corrected English in "fix". Do not invent errors that are not in the essay.`;
