import { z } from "zod";

/**
 * Essay grading rubric modelled on the Georgian National Exam's essay
 * criteria: four axes, five points each, twenty in total.
 */
export const ESSAY_CRITERION_IDS = [
  "content",
  "argumentation",
  "structure",
  "grammar",
] as const;

export type EssayCriterionId = (typeof ESSAY_CRITERION_IDS)[number];

export const ESSAY_CRITERION_MAX = 5;
export const ESSAY_TOTAL_MAX = ESSAY_CRITERION_IDS.length * ESSAY_CRITERION_MAX;

export const ESSAY_CRITERION_LABELS: Record<EssayCriterionId, string> = {
  content: "შინაარსი და თემის დაფარვა",
  argumentation: "არგუმენტაცია და მტკიცებულებები",
  structure: "სტრუქტურა და თანმიმდევრობა",
  grammar: "გრამატიკა და სტილი",
};

export const ESSAY_CRITERION_HINTS: Record<EssayCriterionId, string> = {
  content: "თემაზე პასუხი, სიღრმე, რელევანტური მაგალითები",
  argumentation: "თეზისი, დასაბუთება, კონტრარგუმენტის გათვალისწინება",
  structure: "შესავალი — ძირითადი ნაწილი — დასკვნა, აბზაცების ლოგიკა",
  grammar: "ორთოგრაფია, პუნქტუაცია, ლექსიკის სიზუსტე",
};

export const EssayGraderRequestSchema = z.object({
  essay: z.string().min(1),
  prompt: z.string().optional(),
});

export type EssayGraderRequest = z.infer<typeof EssayGraderRequestSchema>;

export const EssayCriterionScoreSchema = z.object({
  id: z.enum(ESSAY_CRITERION_IDS),
  score: z.number().min(0).max(ESSAY_CRITERION_MAX),
  comment: z.string(),
});

export const EssayCorrectionSchema = z.object({
  issue: z.string(),
  fix: z.string(),
});

/**
 * Deliberately loose on cardinality — structured-output models fail the
 * whole generation on an exact `.length()`. `normalizeEssayReport` below
 * is what guarantees the shape the UI renders.
 */
export const EssayGraderResponseSchema = z.object({
  totalScore: z.number().min(0).max(ESSAY_TOTAL_MAX),
  summary: z.string(),
  criteria: z.array(EssayCriterionScoreSchema),
  strengths: z.array(z.string()),
  corrections: z.array(EssayCorrectionSchema),
});

export type EssayGraderResponse = z.infer<typeof EssayGraderResponseSchema>;
export type EssayCriterionScore = z.infer<typeof EssayCriterionScoreSchema>;

/**
 * Guarantees exactly one entry per rubric criterion, in canonical order,
 * with the total re-derived from the parts. Missing criteria fall back to
 * a mid score rather than dropping a row out of the report.
 */
export function normalizeEssayReport(report: EssayGraderResponse): EssayGraderResponse {
  const byId = new Map(report.criteria.map((item) => [item.id, item]));
  const criteria = ESSAY_CRITERION_IDS.map((id) => {
    const found = byId.get(id);
    return {
      id,
      score: Math.max(0, Math.min(ESSAY_CRITERION_MAX, Math.round(found?.score ?? 3))),
      comment: found?.comment?.trim() || "ამ კრიტერიუმზე დეტალური კომენტარი ვერ დაგენერირდა.",
    };
  });

  return {
    totalScore: criteria.reduce((sum, item) => sum + item.score, 0),
    summary: report.summary,
    criteria,
    strengths: report.strengths.filter(Boolean).slice(0, 4),
    corrections: report.corrections.filter((item) => item.issue && item.fix).slice(0, 6),
  };
}

export const ESSAY_GRADER_JSON_INSTRUCTIONS = `Return ONLY valid JSON matching the schema.
Grade against the Georgian National Exam essay rubric — four criteria, 0-5 each, 20 total:
- content: does the essay actually answer the prompt, with depth and relevant examples?
- argumentation: is there a clear thesis, real evidence, and awareness of a counter-argument?
- structure: introduction / body / conclusion, paragraph logic, transitions.
- grammar: Georgian orthography, punctuation, register and word choice.
totalScore MUST equal the sum of the four criterion scores.
Every string field must be written in natural Georgian.
"corrections" must be concrete and actionable: quote or paraphrase the weak spot in "issue" and give the rewritten/improved version in "fix". Do not invent errors that are not in the text.`;
