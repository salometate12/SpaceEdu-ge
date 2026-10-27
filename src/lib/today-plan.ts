/**
 * „დღეს გეგმაში“ on the dashboard's greeting card: today's study-plan day,
 * read from the same saved plans the study-plan pages write (the student
 * board first, then the dashboard calendar's plan).
 */
import { localToday, readSavedPlan } from "@/lib/study-plan-board";
import { getSavedStudyPlan, type StudyPlanSpace } from "@/lib/study-plan-calendar";

export interface TodayPlan {
  /** „ელასტიურობა, ბაზრები · 2 საათი“ */
  line: string;
  href: string;
}

/** Where „დაწყება“ / „გეგმის შექმნა“ go for each space. */
export function studyPlanHref(space: StudyPlanSpace, day?: string): string {
  if (space === "abiturient") return "/study-plan/abit";
  return day ? `/study-plan?day=${day}` : "/study-plan";
}

/** The day as one line: its topics (or the plan's subject) and its hours. */
export function planLine(day: { topics: string[]; hours: number }, subject?: string): string {
  const topic = day.topics.filter((t) => t.trim()).join(", ") || subject?.trim() || "სასწავლო გეგმა";
  const hours = Number.isFinite(day.hours) && day.hours > 0 ? ` · ${Number(day.hours.toFixed(1))} საათი` : "";
  return `${topic}${hours}`;
}

export function readTodayPlan(space: StudyPlanSpace): TodayPlan | null {
  if (typeof window === "undefined") return null;
  const today = localToday();
  if (space === "student") {
    const board = readSavedPlan();
    const day = board?.plan.find((item) => item.date === today);
    if (board && day) return { line: planLine(day, board.subject), href: studyPlanHref(space, today) };
  }
  const saved = getSavedStudyPlan(space);
  const day = saved?.days.find((item) => item.date === today);
  if (saved && day) return { line: planLine(day, saved.subject), href: studyPlanHref(space, today) };
  return null;
}
