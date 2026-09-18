import { z } from "zod";
import type { ExamYear } from "./text-editing-grader-schema";

/**
 * Georgian National Exam — Part II task 12 "წერითი დავალება" (the essay) rubric.
 *
 * Ten criteria (I–X), 34 points total, transcribed verbatim from the official
 * scoring schemes in `docs/exam-sources/georgian/scoring-*.pdf`. The maxima are
 * year-specific: 2022 gives criterion I up to 3 and criterion X up to 3, while
 * 2023–2025 give criterion I up to 2 and criterion X up to 4. Everything else is
 * identical across the four years, and every year sums to 34.
 *
 * This replaces the old generic 20-point, 4-axis `essay-grader-schema`, which
 * was wrong: the real task is 34 points on 10 criteria.
 */
export const WRITING_TASK_CRITERION_IDS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
] as const;
export type WritingTaskCriterionId = (typeof WRITING_TASK_CRITERION_IDS)[number];

export const WRITING_TASK_TOTAL_MAX = 34;

export const WRITING_TASK_CRITERION_LABELS: Record<WritingTaskCriterionId, string> = {
  I: "დავალების პირობის ადეკვატური გაგება და გააზრება",
  II: "ნაშრომის აგება (სტრუქტურა, ლოგიკურობა)",
  III: "მხატვრული ტექსტის ანალიზი",
  IV: "საკითხის აქტუალობის დასაბუთება",
  V: "ზოგადი განათლება (ცნობადობა, ერუდიცია)",
  VI: "დამოუკიდებელი აზროვნება",
  VII: "ფაქტობრივი სიზუსტე",
  VIII: "ლექსიკა და სტილი",
  IX: "მორფოლოგია, ორთოგრაფია, სინტაქსი",
  X: "პუნქტუაცია",
};

/** Per-year maximum for each criterion (all sum to 34). */
export const WRITING_TASK_CRITERION_MAX: Record<
  ExamYear,
  Record<WritingTaskCriterionId, number>
> = {
  2022: { I: 3, II: 2, III: 6, IV: 5, V: 3, VI: 3, VII: 1, VIII: 3, IX: 5, X: 3 },
  2023: { I: 2, II: 2, III: 6, IV: 5, V: 3, VI: 3, VII: 1, VIII: 3, IX: 5, X: 4 },
  2024: { I: 2, II: 2, III: 6, IV: 5, V: 3, VI: 3, VII: 1, VIII: 3, IX: 5, X: 4 },
  2025: { I: 2, II: 2, III: 6, IV: 5, V: 3, VI: 3, VII: 1, VIII: 3, IX: 5, X: 4 },
};

export function writingTaskMaxes(year: number): Record<WritingTaskCriterionId, number> {
  return WRITING_TASK_CRITERION_MAX[year as ExamYear] ?? WRITING_TASK_CRITERION_MAX[2025];
}

export const WritingTaskGraderRequestSchema = z.object({
  essay: z.string().min(1),
  /** The task prompt / topic. */
  prompt: z.string().optional(),
  year: z.number().optional(),
  /** The bound literary passage, when the task has one (archive tasks do). */
  passageTitle: z.string().optional(),
  passageText: z.string().optional(),
  /** Explicit override; otherwise inferred from whether passageText is present. */
  hasBoundText: z.boolean().optional(),
});

export type WritingTaskGraderRequest = z.infer<typeof WritingTaskGraderRequestSchema>;

export const WritingTaskCriterionScoreSchema = z.object({
  id: z.enum(WRITING_TASK_CRITERION_IDS),
  score: z.number().min(0),
  comment: z.string(),
});

export const WritingTaskCorrectionSchema = z.object({
  issue: z.string(),
  fix: z.string(),
});

/**
 * Loose on cardinality on purpose — structured-output models fail the whole
 * generation on an exact `.length()`. `normalizeWritingTaskReport` guarantees
 * the shape the UI renders.
 */
export const WritingTaskGraderResponseSchema = z.object({
  totalScore: z.number().min(0).max(WRITING_TASK_TOTAL_MAX),
  summary: z.string(),
  criteria: z.array(WritingTaskCriterionScoreSchema),
  strengths: z.array(z.string()),
  corrections: z.array(WritingTaskCorrectionSchema),
});

export type WritingTaskGraderResponse = z.infer<typeof WritingTaskGraderResponseSchema>;
export type WritingTaskCriterionScore = z.infer<typeof WritingTaskCriterionScoreSchema>;

export interface NormalizeWritingTaskOptions {
  year: number;
  /**
   * Whether a bound literary text is attached (the base case for archive
   * tasks). When false — a free-topic essay with no passage to analyse —
   * criterion III ("მხატვრული ტექსტის ანალიზი") cannot be assessed, so we award
   * it full marks and exclude it from the AI's judgement, keeping the familiar
   * 34-point maximum. (The alternative — dropping III and rescaling the other
   * nine to 34 — was rejected to avoid non-integer, hard-to-explain scores.)
   */
  hasBoundText?: boolean;
}

/**
 * Guarantees exactly one entry per criterion, in canonical order, clamped to
 * that year's maximum, with the total re-derived from the parts. Missing
 * criteria fall back to a mid score rather than dropping a row.
 */
export function normalizeWritingTaskReport(
  report: WritingTaskGraderResponse,
  options: NormalizeWritingTaskOptions,
): WritingTaskGraderResponse {
  const { year, hasBoundText = true } = options;
  const maxes = writingTaskMaxes(year);
  const byId = new Map(report.criteria.map((item) => [item.id, item]));

  const criteria = WRITING_TASK_CRITERION_IDS.map((id) => {
    const max = maxes[id];
    // Free-topic essays get criterion III automatically: no bound text to analyse.
    if (id === "III" && !hasBoundText) {
      return {
        id,
        score: max,
        comment: "თავისუფალი თემა — მიბმული მხატვრული ტექსტი არ არის, ამიტომ ეს კრიტერიუმი ავტომატურად სრულ ქულაზეა შეფასებული.",
      };
    }
    const found = byId.get(id);
    const fallback = Math.round(max / 2);
    return {
      id,
      score: Math.max(0, Math.min(max, Math.round(found?.score ?? fallback))),
      comment: found?.comment?.trim() || "ამ კრიტერიუმზე დეტალური კომენტარი ვერ დაგენერირდა.",
    };
  });

  return {
    totalScore: criteria.reduce((sum, item) => sum + item.score, 0),
    summary: report.summary,
    criteria,
    strengths: report.strengths.filter(Boolean).slice(0, 5),
    corrections: report.corrections.filter((item) => item.issue && item.fix).slice(0, 8),
  };
}

/** System-prompt-ready description of the rubric for a given year. */
export function writingTaskRubricText(year: number, hasBoundText = true): string {
  const m = writingTaskMaxes(year);
  const lines = WRITING_TASK_CRITERION_IDS.map((id) => {
    const note =
      id === "III" && !hasBoundText
        ? " — თავისუფალი თემაა, მიბმული ტექსტი არ არის: ეს კრიტერიუმი სრულ ქულაზეა და მას ნუ შეაფასებ."
        : "";
    return `${id}. ${WRITING_TASK_CRITERION_LABELS[id]} — 0-${m[id]}${note}`;
  });
  return [
    `წერითი დავალების შეფასების სქემა (${year} წელი, სულ ${WRITING_TASK_TOTAL_MAX} ქულა, 10 კრიტერიუმი):`,
    ...lines,
  ].join("\n");
}

export const WRITING_TASK_JSON_INSTRUCTIONS = `Return ONLY valid JSON matching the schema.
You are grading a Georgian National Exam Part II essay ("წერითი დავალება", 34 points) against the ten official criteria (I–X) for the given year. Each criterion has its own 0-N maximum, provided in the rubric text.
Score every criterion on its own scale; be calibrated and strict — do NOT inflate. A weak essay must lose points.
totalScore MUST equal the sum of the ten criterion scores.
Criterion III ("მხატვრული ტექსტის ანალიზი") is about how well the essay reads and analyses the bound literary text; if the rubric says there is no bound text, leave III at full marks and do not judge it.
Every string field must be written in natural Georgian.
"corrections" must be concrete: quote or paraphrase the weak spot in "issue" and give the improved version in "fix". Do not invent problems that are not in the essay.`;
