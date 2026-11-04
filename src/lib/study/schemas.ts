/**
 * „სწავლის სესია“: what the AI returns (zod, OpenAI-strict: every key
 * required, nullable where it may be absent) and the limits both sides
 * agree on.
 */
import { z } from "zod";

export const STUDY_MODES = ["full", "quick", "check"] as const;
export type StudyMode = (typeof STUDY_MODES)[number];

export const STUDY_MAX_FILES = 5;
export const CHECK_QUESTIONS = 8;

/** A slide of a presentation or a page of a document, in one of the session's files. */
export const SourceRefSchema = z.object({
  fileId: z.string(),
  /** 1-based slide or page number. */
  unit: z.number().int(),
});
export type SourceRef = z.infer<typeof SourceRefSchema>;

export const PlanSchema = z.object({
  parts: z.array(
    z.object({
      title: z.string(),
      refs: z.array(SourceRefSchema),
    }),
  ),
});
export type StudyPlanPart = z.infer<typeof PlanSchema>["parts"][number];

export const CheckSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctIndex: z.number().int(),
  feedback: z.string(),
});
export type StudyCheck = z.infer<typeof CheckSchema>;

export const PartSchema = z.object({
  /** Markdown, 80–160 words; LaTeX in $…$. */
  explanation: z.string(),
  example: z.string().nullable(),
  check: CheckSchema,
});
export type StudyPart = z.infer<typeof PartSchema>;

/** „შემამოწმე“: 8 questions over the whole material, each with the topic it tests. */
export const CheckQuizSchema = z.object({
  questions: z.array(
    CheckSchema.extend({
      topic: z.string(),
      refs: z.array(SourceRefSchema),
    }),
  ),
});
export type CheckQuestion = z.infer<typeof CheckQuizSchema>["questions"][number];

/** How many parts a plan has: a full pass 5–10, a quick review 3–5. */
export function partRange(mode: StudyMode): [number, number] {
  return mode === "quick" ? [3, 5] : [5, 10];
}

/** A model's slip into another script („სპეციალურ结构-ს“): never meant in a Georgian lesson. */
const FOREIGN_SCRIPT = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Sinhala}\p{Script=Devanagari}\p{Script=Thai}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Bengali}\p{Script=Arabic}\p{Script=Hebrew}]+/gu;

export function hasForeignScript(text: string): boolean {
  return new RegExp(FOREIGN_SCRIPT.source, "u").test(text);
}

/** The word left without it, when a second try slipped too. */
export function withoutForeignScript(text: string): string {
  return text.replace(FOREIGN_SCRIPT, "").replace(/ {2,}/g, " ");
}

/** „გამარჯობა!“, „მოგესალმებით მეგობრებო.“, „მოდით განვიხილოთ …“: a part starts with its content. */
const GREETING = /^(?:(?:გამარჯობა|მოგესალმებით|სალამი)[^.!?\n]*[.!?]+\s*|(?:დღეს|მოდით|ახლა)\s+(?:გავეცნოთ|განვიხილოთ|გავეცნობით|განვიხილავთ|ვისაუბროთ)[^.!?:\n]*[.!?:]+\s*)/;

export function withoutGreeting(text: string): string {
  let out = text.trim();
  for (let i = 0; i < 3 && GREETING.test(out); i += 1) out = out.replace(GREETING, "").trim();
  return out || text.trim();
}

/** „სწორია!“, „ზუსტად ასეა!“: the screen says right or wrong itself, so a feedback never starts with it. */
const VERDICT = /^(?:სწორია|სწორი პასუხია|ზუსტად(?: ასეა)?|ასეა|მართალია|კარგია|არასწორია|არა)[!.,:\s]+/i;

/** A question as the session can use it: three options, a correct index among them, a neutral feedback. */
export function cleanCheck<T extends StudyCheck>(check: T): T | null {
  const options = check.options.map((option) => option.trim()).filter(Boolean).slice(0, 3);
  if (!check.question.trim() || options.length < 2) return null;
  const correctIndex = Math.min(Math.max(0, check.correctIndex), options.length - 1);
  let feedback = check.feedback.trim();
  while (VERDICT.test(feedback)) feedback = feedback.replace(VERDICT, "").trim();
  return { ...check, question: check.question.trim(), options, correctIndex, feedback };
}
