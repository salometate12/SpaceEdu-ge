import { z } from "zod";
import {
  isIsoDate,
  resolveMilestoneDate,
  type MilestoneDateStatus,
} from "@/lib/syllabus-date-utils";

export const SyllabusOptionsSchema = z.object({
  plan: z.boolean().optional(),
  midterms: z.boolean().optional(),
  "quiz-weeks": z.boolean().optional(),
});

export const SyllabusRequestSchema = z.object({
  fileName: z.string().optional(),
  textBody: z.string().min(50),
  /** Accepted for backwards compatibility only — the options filter the
   * results in the UI and no longer narrow what the AI looks for. */
  options: SyllabusOptionsSchema.optional(),
  /** ISO (YYYY-MM-DD) date the semester begins — the anchor that turns
   * "Week 8" style references into real calendar dates. */
  semesterStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "სემესტრის დაწყების თარიღი არასწორია.")
    .optional(),
});

export type SyllabusRequest = z.infer<typeof SyllabusRequestSchema>;

export const SYLLABUS_MILESTONE_TYPES = ["quiz", "midterm", "final", "deadline"] as const;
export const SyllabusMilestoneTypeSchema = z.enum(SYLLABUS_MILESTONE_TYPES);
export type SyllabusAiMilestoneType = z.infer<typeof SyllabusMilestoneTypeSchema>;

/**
 * One event as the model reads it. The model reports what the syllabus
 * literally says; the calendar date is computed in code from
 * `rawDateText` / `week` / `weekday` (see `normalizeSyllabusMilestones`).
 */
export const SyllabusAiMilestoneSchema = z.object({
  title: z.string(),
  type: SyllabusMilestoneTypeSchema,
  /** The quiz/midterm's own number ("ქვიზი 3" → 3), if stated. */
  number: z.number().int().nullable(),
  /** The exact "when" fragment from the text, e.g. "12.10" or "მე-7 კვირა, ხუთშაბათი". */
  rawDateText: z.string().nullable(),
  /** Week-of-semester as written, e.g. "7" or "VII". */
  week: z.string().nullable(),
  /** Weekday as written, e.g. "ხუთშაბათი". */
  weekday: z.string().nullable(),
  /** The model's own YYYY-MM-DD reading — only compared against, never trusted. */
  date: z.string().nullable(),
  topic: z.string().nullable(),
  /** Points this event is worth. */
  points: z.number().nullable(),
  /** Share of the final grade, in percent. */
  weight: z.number().nullable(),
  /** The table row / sentence the event was read from. */
  sourceText: z.string().nullable(),
});

export type SyllabusAiMilestone = z.infer<typeof SyllabusAiMilestoneSchema>;

export const SyllabusExpectedCountsSchema = z.object({
  quiz: z.number().int().nullable(),
  midterm: z.number().int().nullable(),
  final: z.number().int().nullable(),
});

export type SyllabusExpectedCounts = z.infer<typeof SyllabusExpectedCountsSchema>;

/** What the model returns. */
export const SyllabusAiResponseSchema = z.object({
  insight: z.string(),
  milestones: z.array(SyllabusAiMilestoneSchema),
  /** How many of each the grading section says there are ("ქვიზი 4 × 5 ქულა" → 4). */
  expectedCounts: SyllabusExpectedCountsSchema,
  /** Anything the model was unsure about, in Georgian. */
  warnings: z.array(z.string()),
});

export type SyllabusAiResponse = z.infer<typeof SyllabusAiResponseSchema>;

export interface SyllabusMilestoneResult {
  id: string;
  title: string;
  type: SyllabusAiMilestoneType;
  number: number | null;
  /** YYYY-MM-DD, or null when the syllabus doesn't say when. */
  date: string | null;
  dateStatus: MilestoneDateStatus;
  week: string | null;
  weekday: string | null;
  rawDateText: string | null;
  topic: string | null;
  points: number | null;
  weight: number | null;
  sourceText: string | null;
}

/** What the API returns to the page. */
export interface SyllabusResponse {
  insight: string;
  milestones: SyllabusMilestoneResult[];
  expectedCounts: SyllabusExpectedCounts;
  /** Model warnings plus the count checks below, in Georgian. */
  warnings: string[];
}

export interface SyllabusDateMismatch {
  title: string;
  modelDate: string;
  computedDate: string | null;
  rawDateText: string | null;
  week: string | null;
}

export interface NormalizeSyllabusResult {
  milestones: SyllabusMilestoneResult[];
  warnings: string[];
  /** Where the model's own date disagreed with ours — for the server log. */
  dateMismatches: SyllabusDateMismatch[];
  /** Quiz mentions counted straight from the text, for the server log. */
  quizMentionsInText: number;
}

const DATE_STATUS_RANK: Record<MilestoneDateStatus, number> = {
  exact: 2,
  "computed-from-week": 1,
  unknown: 0,
};

function cleanText(value: string | null | undefined): string | null {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed : null;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Small stable hash so the same syllabus event keeps the same id across
 * uploads (re-adding it replaces, not duplicates) while two different
 * syllabi never collide on "quiz-1". */
function stableHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

function isSameEvent(a: SyllabusMilestoneResult, b: SyllabusMilestoneResult): boolean {
  if (a.type !== b.type) return false;
  const sameIdentity =
    (a.number !== null && a.number === b.number) ||
    normalizeTitle(a.title) === normalizeTitle(b.title);
  if (!sameIdentity) return false;
  return a.date === b.date || a.date === null || b.date === null;
}

function mergeEvents(a: SyllabusMilestoneResult, b: SyllabusMilestoneResult): SyllabusMilestoneResult {
  const [primary, secondary] =
    DATE_STATUS_RANK[b.dateStatus] > DATE_STATUS_RANK[a.dateStatus] ? [b, a] : [a, b];
  const merged = { ...primary };
  for (const key of Object.keys(merged) as Array<keyof SyllabusMilestoneResult>) {
    if (merged[key] === null && secondary[key] !== null) {
      (merged as Record<string, unknown>)[key] = secondary[key];
    }
  }
  return merged;
}

const QUIZ_WORD = String.raw`(?:ქვიზ|კვიზ|quiz)`;

/**
 * A deterministic lower bound on how many quizzes the syllabus mentions:
 * the distinct numbered quizzes ("ქვიზი 1", "Quiz 2", "Q3") or a stated
 * count ("4 ქვიზი", "ქვიზი 4 × 5 ქულა"), whichever is larger.
 */
export function countQuizMentions(text: string): number {
  const numbered = new Set<number>();
  const numberedPattern = new RegExp(
    String.raw`${QUIZ_WORD}[ა-ჰa-z]*\s*[-#№]?\s*(\d{1,2})(?!\s*(?:[%×xX*]|ქულ|points?|pts|\d|[.,]\d))`,
    "giu",
  );
  for (const m of text.matchAll(numberedPattern)) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 20) numbered.add(n);
  }
  for (const m of text.matchAll(/(?<![A-Za-z])Q(\d{1,2})(?![\dA-Za-z])/g)) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 20) numbered.add(n);
  }

  let stated = 0;
  const countPatterns = [
    new RegExp(String.raw`${QUIZ_WORD}[ა-ჰa-z]*\s*[(:]?\s*(\d{1,2})\s*[×xX*]`, "giu"),
    // Not "კვირა 7 ქვიზი" / "Week 7 Quiz" / "მე-7": those are weeks, not counts.
    new RegExp(
      String.raw`(?<![\d.,/-])(?<!(?:კვირ[ა-ჰ]*|week|მე)\s*[:#№-]?\s*)(\d{1,2})\s*[×xX*]?\s*${QUIZ_WORD}`,
      "giu",
    ),
  ];
  for (const pattern of countPatterns) {
    for (const m of text.matchAll(pattern)) {
      const n = Number(m[1]);
      if (n >= 1 && n <= 20) stated = Math.max(stated, n);
    }
  }

  return Math.max(numbered.size, stated);
}

const TYPE_COUNT_LABEL: Record<keyof SyllabusExpectedCounts, string> = {
  quiz: "ქვიზი",
  midterm: "შუალედური",
  final: "ფინალური",
};

/**
 * Turns the model's reading into calendar-ready events: computes every
 * date in code, merges duplicates, sorts by date (undated last) and
 * checks the quiz count against the grading section and the raw text.
 */
export function normalizeSyllabusMilestones(
  response: SyllabusAiResponse,
  {
    semesterStartDate,
    sourceText = "",
    fileName = "",
  }: { semesterStartDate?: string; sourceText?: string; fileName?: string } = {},
): NormalizeSyllabusResult {
  const dateMismatches: SyllabusDateMismatch[] = [];
  const merged: SyllabusMilestoneResult[] = [];

  for (const item of response.milestones) {
    const title = cleanText(item.title);
    if (!title) continue;
    const rawDateText = cleanText(item.rawDateText);
    const week = cleanText(item.week);
    const weekday = cleanText(item.weekday);
    const resolved = resolveMilestoneDate({ rawDateText, week, weekday, semesterStartDate });

    const modelDate = cleanText(item.date);
    if (modelDate && isIsoDate(modelDate) && modelDate !== resolved.date) {
      dateMismatches.push({ title, modelDate, computedDate: resolved.date, rawDateText, week });
    }

    const result: SyllabusMilestoneResult = {
      id: "",
      title,
      type: item.type,
      number: item.number ?? null,
      date: resolved.date,
      dateStatus: resolved.dateStatus,
      week: week ?? (resolved.weekNumber ? String(resolved.weekNumber) : null),
      weekday,
      rawDateText,
      topic: cleanText(item.topic),
      points: item.points ?? null,
      weight: item.weight ?? null,
      sourceText: cleanText(item.sourceText),
    };

    const duplicateIndex = merged.findIndex((existing) => isSameEvent(existing, result));
    if (duplicateIndex === -1) {
      merged.push(result);
    } else {
      merged[duplicateIndex] = mergeEvents(merged[duplicateIndex], result);
    }
  }

  merged.sort((a, b) => {
    if (a.date === b.date) return 0;
    if (a.date === null) return 1;
    if (b.date === null) return -1;
    return a.date.localeCompare(b.date);
  });

  const seenIds = new Map<string, number>();
  const milestones = merged.map((item) => {
    const base = `syllabus-${item.type}-${stableHash(
      [fileName, item.type, item.number ?? "", normalizeTitle(item.title), item.rawDateText ?? "", item.week ?? ""].join("|"),
    )}`;
    const seen = seenIds.get(base) ?? 0;
    seenIds.set(base, seen + 1);
    return { ...item, id: seen === 0 ? base : `${base}-${seen + 1}` };
  });

  const warnings = response.warnings.map((w) => w.trim()).filter(Boolean);

  const found: Record<keyof SyllabusExpectedCounts, number> = { quiz: 0, midterm: 0, final: 0 };
  for (const item of milestones) {
    if (item.type in found) found[item.type as keyof SyllabusExpectedCounts] += 1;
  }
  for (const key of Object.keys(TYPE_COUNT_LABEL) as Array<keyof SyllabusExpectedCounts>) {
    const expected = response.expectedCounts[key];
    if (expected !== null && expected > 0 && expected !== found[key]) {
      warnings.push(
        `შეფასების სისტემაში ${expected} ${TYPE_COUNT_LABEL[key]} წერია, ნაპოვნია ${found[key]}. შეადარე სილაბუსს.`,
      );
    }
  }

  const quizMentionsInText = countQuizMentions(sourceText);
  if (quizMentionsInText > found.quiz && quizMentionsInText !== response.expectedCounts.quiz) {
    warnings.push(
      `შესაძლოა ყველა ქვიზი არ იყოს ნაპოვნი: ტექსტში ჩანს სულ მცირე ${quizMentionsInText} ქვიზი, ნაპოვნია ${found.quiz}.`,
    );
  }

  const undated = milestones.filter((item) => item.date === null).length;
  if (undated > 0) {
    warnings.push(
      `${undated} მოვლენის თარიღი სილაბუსში არ წერია — მიუთითე ხელით, რომ კალენდარში დაემატოს.`,
    );
  }

  return { milestones, warnings, dateMismatches, quizMentionsInText };
}
