/**
 * The study-plan page's state as pure helpers: checking the form, the plan
 * days on the strip, and the saved plan (with its done days) on this
 * device, so it's there again on the next visit.
 */
import { MAX_STUDY_PLAN_DAYS } from "@/lib/ai/study-plan-days";
import type { StudyPlanResponse } from "@/lib/ai/study-plan-schema";

export type StudyPlanDay = StudyPlanResponse["plan"][number];

export const STUDY_PLAN_BOARD_KEY = "spaceedu:study-plan:student";

export interface SavedStudyPlan {
  subject: string;
  examDate: string;
  hoursPerDay: number;
  topics: string[];
  plan: StudyPlanDay[];
  totalDays: number;
  advice: string;
  /** Dates of the days marked done. */
  done: string[];
  /** Built without topics or a syllabus: a general plan. */
  general: boolean;
  createdAt: number;
}

const DAY_MS = 86_400_000;
const toUtc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Whole days from today to the exam (0 = today). */
export function daysUntil(examDate: string, today: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(examDate)) return 0;
  return Math.round((toUtc(examDate) - toUtc(today)) / DAY_MS);
}

export interface StudyPlanFormCheck {
  subject?: string;
  examDate?: string;
  /** Not an error: the plan covers the nearest 30 days. */
  longRange: boolean;
}

/** The form's own messages, instead of the browser's English bubbles. */
export function checkStudyPlanForm({ subject, examDate }: { subject: string; examDate: string }, today: string): StudyPlanFormCheck {
  const result: StudyPlanFormCheck = { longRange: false };
  if (!subject.trim()) result.subject = "აირჩიე საგანი";
  if (!examDate) result.examDate = "აირჩიე გამოცდის თარიღი";
  else if (daysUntil(examDate, today) < 1) result.examDate = "თარიღი მომავალში უნდა იყოს";
  else result.longRange = daysUntil(examDate, today) > MAX_STUDY_PLAN_DAYS;
  return result;
}

/** „ელასტიურობა, ბაზარი“ → two topics; trims and drops repeats. */
export function splitTopics(text: string, existing: string[] = []): string[] {
  const seen = new Set(existing.map((topic) => topic.toLowerCase()));
  const added: string[] = [];
  for (const part of text.split(/[,\n،]+/)) {
    const topic = part.replace(/\s+/g, " ").trim();
    if (!topic || seen.has(topic.toLowerCase())) continue;
    seen.add(topic.toLowerCase());
    added.push(topic);
  }
  return [...existing, ...added];
}

const WEEKDAYS_SHORT = ["კვ", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"];

/** The strip's chip for a plan day: „ოთხ“ over „23“. */
export function dayChip(date: string): { weekday: string; day: number } {
  const ms = toUtc(date);
  return { weekday: WEEKDAYS_SHORT[new Date(ms).getUTCDay()], day: new Date(ms).getUTCDate() };
}

export const FOCUS_LABEL: Record<StudyPlanDay["focus_level"], string> = {
  high: "ინტენსიური",
  medium: "საშუალო",
  review: "გამეორება",
};

export function toggleDone(done: string[], date: string): string[] {
  return done.includes(date) ? done.filter((item) => item !== date) : [...done, date];
}

function isSavedPlan(value: unknown): value is SavedStudyPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Partial<SavedStudyPlan>;
  return (
    typeof plan.subject === "string" &&
    typeof plan.examDate === "string" &&
    Array.isArray(plan.plan) &&
    Array.isArray(plan.done) &&
    typeof plan.advice === "string"
  );
}

export function parseSavedPlan(raw: string | null): SavedStudyPlan | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isSavedPlan(parsed)) return null;
    return { ...parsed, topics: Array.isArray(parsed.topics) ? parsed.topics : [], general: Boolean(parsed.general) };
  } catch {
    return null;
  }
}

export function readSavedPlan(): SavedStudyPlan | null {
  try {
    return parseSavedPlan(window.localStorage.getItem(STUDY_PLAN_BOARD_KEY));
  } catch {
    return null;
  }
}

export function writeSavedPlan(plan: SavedStudyPlan): void {
  try {
    window.localStorage.setItem(STUDY_PLAN_BOARD_KEY, JSON.stringify(plan));
  } catch {
    // kept for this visit only
  }
}

/** Today, YYYY-MM-DD, in local time. */
export function localToday(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** A plan just made, stamped now, nothing done yet. */
export function newSavedPlan(fields: Omit<SavedStudyPlan, "done" | "createdAt">): SavedStudyPlan {
  return { ...fields, done: [], createdAt: Date.now() };
}
