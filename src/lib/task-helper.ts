/**
 * „დავალების დამხმარე“ as pure functions: the step dates (spread from today
 * to the day before the due date, never the model's), days left, the
 * sections asked for, and the model's answer kept to the agreed sizes.
 */
import {
  DEFAULT_TASK_SECTIONS,
  TASK_SECTIONS,
  TASK_TYPES,
  type TaskHelperModelAnswer,
  type TaskHelperResult,
  type TaskSection,
  type TaskType,
} from "@/lib/ai/task-helper-schema";

/** How much of the assignment's text is kept (for the chat's context): enough for any brief, small enough for the row. */
export const TASK_INPUT_MAX_CHARS = 12_000;

/** What one plan costs. Not charged yet: there's no credit balance. */
export const TASK_HELPER_CREDIT_COST = 1;

const DAY = 86_400_000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function toUtc(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && DATE.test(value) && !Number.isNaN(toUtc(value));
}

/** A local day as YYYY-MM-DD. */
export function localDay(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * `count` dates from `today` to the day before `due`, as evenly as whole
 * days allow; the last step always lands the day before. Due today or
 * already past: every step is today.
 */
export function spreadStepDates(count: number, today: string, due: string): string[] {
  if (count <= 0) return [];
  const start = toUtc(today);
  const last = toUtc(due) - DAY;
  if (last <= start) return Array.from({ length: count }, () => today);
  if (count === 1) return [fromUtc(last)];
  const span = (last - start) / DAY;
  return Array.from({ length: count }, (_, index) => fromUtc(start + Math.round((index * span) / (count - 1)) * DAY));
}

/** Whole days from `today` to `due` (0 on the day, negative after). */
export function daysUntil(due: string, today: string): number {
  return Math.round((toUtc(due) - toUtc(today)) / DAY);
}

/** The sections from the form: known ones only, the default three when none. */
export function parseSections(values: unknown[]): TaskSection[] {
  const picked = TASK_SECTIONS.filter((section) => values.includes(section));
  return picked.length > 0 ? picked : DEFAULT_TASK_SECTIONS;
}

export function parseTaskType(value: unknown): TaskType {
  return TASK_TYPES.some((type) => type.id === value) ? (value as TaskType) : "other";
}

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

/**
 * The model's answer in the agreed sizes (3–8 requirements, up to 8 steps,
 * exactly 3 ideas when there are, up to 5 tips, 2–3 quick replies), only
 * the sections asked for, and the step dates when there's a due date.
 */
export function finishTaskResult(
  answer: TaskHelperModelAnswer,
  sections: TaskSection[],
  { today, due }: { today: string; due?: string | null },
): TaskHelperResult {
  const steps = sections.includes("steps") ? (answer.steps ?? []).slice(0, 8) : undefined;
  const dates = steps && due ? spreadStepDates(steps.length, today, due) : [];
  return {
    title: clean(answer.title) || "დავალება",
    requirements: answer.requirements.map(clean).filter(Boolean).slice(0, 8),
    ...(answer.grading?.trim() ? { grading: answer.grading.trim() } : {}),
    ...(steps ? { steps: steps.map((step, index) => ({ title: clean(step.title), detail: step.detail.trim(), ...(dates[index] ? { date: dates[index] } : {}) })) } : {}),
    ...(sections.includes("ideas") && answer.ideas ? { ideas: answer.ideas.slice(0, 3).map((idea) => ({ ...idea, tags: idea.tags.slice(0, 4) })) } : {}),
    ...(sections.includes("tips") && answer.tips ? { tips: answer.tips.slice(0, 5) } : {}),
    ...(sections.includes("presentation") && answer.presentation ? { presentation: answer.presentation } : {}),
    followUp: { question: answer.followUp.question.trim(), options: answer.followUp.options.map(clean).filter(Boolean).slice(0, 3) },
  };
}
