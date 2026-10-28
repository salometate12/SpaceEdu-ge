import { getGeneratedMilestones, type SyllabusMilestone } from "./syllabus-calendar";
import { localToday } from "./study-plan-board";
import { getSavedStudyPlan, type SavedStudyPlan, type StudyPlanSpace } from "./study-plan-calendar";

/**
 * The dashboard's „N დღე გამოცდამდე / სესიამდე“ tile, from dates the user
 * actually has:
 *
 * - abiturient: the last day of the saved study plan is the planned exam
 *   date;
 * - student: the nearest midterm or final the syllabus analyzer found,
 *   else the last day of the saved study plan.
 *
 * With no such date the tile asks for one instead of showing a number. The
 * old placeholder (a random number stored under EXAM_COUNTDOWN_KEY) is no
 * longer read or written; the key stays registered for sync so rows saved
 * under it still load.
 */
export type ExamCountdown =
  | { kind: "days"; days: number; date: string }
  /** No date to count to. */
  | { kind: "missing" }
  /** The abiturient's planned exam date is behind them. */
  | { kind: "passed"; date: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isDate(value: unknown): value is string {
  return typeof value === "string" && DATE_RE.test(value) && !Number.isNaN(Date.parse(value));
}

/** Whole calendar days from `from` to `to`, both YYYY-MM-DD. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function countTo(date: string, today: string): ExamCountdown {
  const days = daysBetween(today, date);
  return days < 0 ? { kind: "passed", date } : { kind: "days", days, date };
}

/** The planned exam date: the plan's last day. */
export function abiturientExamCountdown(plan: SavedStudyPlan | null, today: string): ExamCountdown {
  const date = plan?.days.at(-1)?.date;
  return isDate(date) ? countTo(date, today) : { kind: "missing" };
}

/** The nearest upcoming midterm or final, else the plan's last day. */
export function studentSessionCountdown(
  milestones: SyllabusMilestone[],
  plan: SavedStudyPlan | null,
  today: string,
): ExamCountdown {
  const exam = milestones
    .filter((m) => (m.type === "midterm" || m.type === "final") && isDate(m.date) && m.date >= today)
    .map((m) => m.date as string)
    .sort()[0];
  if (exam) return countTo(exam, today);

  const planEnd = plan?.days.at(-1)?.date;
  if (isDate(planEnd) && planEnd >= today) return countTo(planEnd, today);
  return { kind: "missing" };
}

export function getExamCountdown(space: StudyPlanSpace, today: string = localToday()): ExamCountdown {
  if (typeof window === "undefined") return { kind: "missing" };
  const plan = getSavedStudyPlan(space);
  return space === "abiturient"
    ? abiturientExamCountdown(plan, today)
    : studentSessionCountdown(getGeneratedMilestones(), plan, today);
}

/** Where the tile sends someone who has no date yet. */
export const EXAM_DATE_HREF: Record<StudyPlanSpace, string> = {
  abiturient: "/study-plan/abit",
  student: "/syllabus",
};

export const EXAM_DATE_PROMPT: Record<StudyPlanSpace, string> = {
  abiturient: "მიუთითე გამოცდის თარიღი სასწავლო გეგმაში",
  student: "დაამატე სილაბუსი, რომ სესიის თარიღი გამოჩნდეს",
};

export const EXAM_DATE_PASSED = "გამოცდის თარიღი გავიდა";
export const EXAM_DATE_RENEW = "განაახლე გეგმა";
