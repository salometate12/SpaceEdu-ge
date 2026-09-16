import { z } from "zod";

/**
 * Georgian National Exam — Part I "ტექსტის რედაქტირება" (text editing) rubric.
 *
 * Three criteria, 16 points total, taken verbatim from the official scoring
 * schemes in `docs/exam-sources/georgian/scoring-*.pdf`. The per-criterion
 * maxima are year-specific: 2022 splits the 16 as 9 / 2 / 5, while 2023–2025
 * split it as 8 / 2 / 6. The scheme's own rule is "each error of that type
 * costs one point off the criterion's maximum".
 */
export const TEXT_EDITING_CRITERION_IDS = ["I", "II", "III"] as const;
export type TextEditingCriterionId = (typeof TEXT_EDITING_CRITERION_IDS)[number];

export type ExamYear = 2022 | 2023 | 2024 | 2025;

export const TEXT_EDITING_TOTAL_MAX = 16;

export const TEXT_EDITING_CRITERION_LABELS: Record<TextEditingCriterionId, string> = {
  I: "მორფოლოგიურ-ორთოგრაფიული და სინტაქსური შეცდომები, მექანიკური შეცდომები",
  II: "სტილისტური ხარვეზები და ტექსტური უზუსტობები",
  III: "პუნქტუაციური შეცდომები",
};

/** Per-year maximum for each criterion (all sum to 16). */
export const TEXT_EDITING_CRITERION_MAX: Record<ExamYear, Record<TextEditingCriterionId, number>> = {
  2022: { I: 9, II: 2, III: 5 },
  2023: { I: 8, II: 2, III: 6 },
  2024: { I: 8, II: 2, III: 6 },
  2025: { I: 8, II: 2, III: 6 },
};

/** The maxima for a year, defaulting to the 2023–2025 split for anything else. */
export function textEditingMaxes(year: number): Record<TextEditingCriterionId, number> {
  return TEXT_EDITING_CRITERION_MAX[year as ExamYear] ?? TEXT_EDITING_CRITERION_MAX[2025];
}

export const TextEditingCriterionScoreSchema = z.object({
  id: z.enum(TEXT_EDITING_CRITERION_IDS),
  score: z.number().min(0),
  comment: z.string(),
});

export const TextEditingCorrectionSchema = z.object({
  original: z.string(),
  fixed: z.string(),
  type: z.enum(TEXT_EDITING_CRITERION_IDS).optional(),
});

/**
 * Loose on cardinality on purpose — structured-output models fail the whole
 * generation on an exact `.length()`. `normalizeTextEditingReport` is what
 * guarantees the shape the UI renders.
 */
export const TextEditingGraderResponseSchema = z.object({
  totalScore: z.number().min(0).max(TEXT_EDITING_TOTAL_MAX),
  summary: z.string(),
  criteria: z.array(TextEditingCriterionScoreSchema),
  corrections: z.array(TextEditingCorrectionSchema),
});

export type TextEditingGraderResponse = z.infer<typeof TextEditingGraderResponseSchema>;
export type TextEditingCriterionScore = z.infer<typeof TextEditingCriterionScoreSchema>;
export type TextEditingCorrection = z.infer<typeof TextEditingCorrectionSchema>;

/**
 * Guarantees exactly one entry per criterion, clamped to that year's maximum,
 * with the total re-derived from the parts. A missing criterion is treated as
 * full marks (no deduction), matching the scheme's "start at max, subtract per
 * error" logic — so a silent model omission never invents lost points.
 */
export function normalizeTextEditingReport(
  report: TextEditingGraderResponse,
  year: number,
): TextEditingGraderResponse {
  const maxes = textEditingMaxes(year);
  const byId = new Map(report.criteria.map((item) => [item.id, item]));
  const criteria = TEXT_EDITING_CRITERION_IDS.map((id) => {
    const found = byId.get(id);
    const max = maxes[id];
    const raw = found?.score ?? max;
    return {
      id,
      score: Math.max(0, Math.min(max, Math.round(raw))),
      comment: found?.comment?.trim() || "ამ კრიტერიუმზე დეტალური კომენტარი ვერ დაგენერირდა.",
    };
  });

  return {
    totalScore: criteria.reduce((sum, item) => sum + item.score, 0),
    summary: report.summary,
    criteria,
    corrections: report.corrections.filter((item) => item.original && item.fixed).slice(0, 20),
  };
}

/** System-prompt-ready description of the rubric for a given year. */
export function textEditingRubricText(year: number): string {
  const m = textEditingMaxes(year);
  return [
    `ტექსტის რედაქტირების შეფასების სქემა (${year} წელი, სულ ${TEXT_EDITING_TOTAL_MAX} ქულა):`,
    `I. ${TEXT_EDITING_CRITERION_LABELS.I} — მაქს. ${m.I} ქულა. ამ ტიპის ყოველ შეცდომაზე მაქსიმალურ შეფასებას (${m.I}) აკლდება თითო ქულა.`,
    `II. ${TEXT_EDITING_CRITERION_LABELS.II} — მაქს. ${m.II} ქულა. ყოველ ხარვეზსა თუ უზუსტობაზე მაქსიმალურ შეფასებას (${m.II}) აკლდება თითო ქულა.`,
    `III. ${TEXT_EDITING_CRITERION_LABELS.III} — მაქს. ${m.III} ქულა. ყოველ შეცდომაზე მაქსიმალურ შეფასებას (${m.III}) აკლდება თითო ქულა.`,
  ].join("\n");
}

export const TEXT_EDITING_JSON_INSTRUCTIONS = `Return ONLY valid JSON matching the schema.
You are grading a Georgian National Exam Part I "ტექსტის რედაქტირება" (text editing) answer: the student rewrote a given source text, fixing its errors. Compare the student's version against the source and count the real, remaining errors of each type.
Score each of the three criteria (I, II, III) starting from that criterion's maximum for this year and subtracting one point per error of that type, never below 0.
totalScore MUST equal the sum of the three criterion scores.
Every string field must be written in natural Georgian.
"corrections" must list concrete fixes the student still missed or introduced: put the wrong fragment in "original" and the correct form in "fixed", and set "type" to the criterion it belongs to. Do not invent errors that are not in the text; if the student's version is clean, return an empty corrections array and full scores.`;
