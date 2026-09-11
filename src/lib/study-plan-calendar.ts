import { recordDailyActivity } from "./daily-streak";
import type { SyllabusMilestone } from "@/lib/syllabus-calendar";

export type StudyPlanSpace = "student" | "abiturient";

export interface StudyPlanCalendarDay {
  date: string;
  day_name: string;
  topics: string[];
  hours: number;
  tasks: string[];
  focus_level: "high" | "medium" | "review";
}

export interface SavedStudyPlan {
  subject: string;
  savedAt: string;
  totalDays: number;
  days: StudyPlanCalendarDay[];
  doneDates: string[];
}

function storageKey(space: StudyPlanSpace): string {
  return space === "abiturient"
    ? "spaceedu-dashboard-study-plan"
    : "spaceedu-dashboard-study-plan-student";
}

export const STUDY_PLAN_CALENDAR_UPDATED_EVENT = "spaceedu-study-plan-calendar-updated";

function notifyStudyPlanCalendarUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STUDY_PLAN_CALENDAR_UPDATED_EVENT));
}

export function getSavedStudyPlan(space: StudyPlanSpace): SavedStudyPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(space));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedStudyPlan;
    return { ...parsed, doneDates: parsed.doneDates ?? [] };
  } catch {
    return null;
  }
}

export function saveStudyPlanToDashboard(
  space: StudyPlanSpace,
  subject: string,
  days: StudyPlanCalendarDay[],
  totalDays: number,
): void {
  if (typeof window === "undefined") return;
  const record: SavedStudyPlan = {
    subject,
    savedAt: new Date().toISOString(),
    totalDays,
    days,
    doneDates: [],
  };
  window.localStorage.setItem(storageKey(space), JSON.stringify(record));
  notifyStudyPlanCalendarUpdated();
}

export function toggleStudyPlanDayDone(space: StudyPlanSpace, date: string): void {
  const current = getSavedStudyPlan(space);
  if (!current) return;
  const isDone = current.doneDates.includes(date);
  const nextDoneDates = isDone
    ? current.doneDates.filter((item) => item !== date)
    : [...current.doneDates, date];
  const next: SavedStudyPlan = { ...current, doneDates: nextDoneDates };
  window.localStorage.setItem(storageKey(space), JSON.stringify(next));
  notifyStudyPlanCalendarUpdated();
  if (!isDone) {
    recordDailyActivity();
  }
}

export function clearSavedStudyPlan(space: StudyPlanSpace): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(space));
  notifyStudyPlanCalendarUpdated();
}

/* -------------------------------------------------------------------------- */
/*                     PUTTING A PLAN ON THE DASHBOARD CALENDAR               */
/* -------------------------------------------------------------------------- */

/**
 * A plan day, expressed as a dated calendar entry.
 *
 * The id is derived from the space and the date rather than generated, so
 * adding the same day twice replaces its entry instead of piling up
 * duplicates, and "is this day already on the calendar?" is answerable
 * without storing anything extra.
 */
export function studyDayCalendarId(space: StudyPlanSpace, date: string): string {
  return `study-plan-${space}-${date}`;
}

export function studyDayAsMilestone(
  space: StudyPlanSpace,
  subject: string,
  day: StudyPlanCalendarDay,
): SyllabusMilestone {
  return {
    id: studyDayCalendarId(space, day.date),
    title: `${subject} — ${day.topics.join(", ")}`,
    date: day.date,
    topic: `${day.hours} საათი · ${day.day_name}`,
    type: "study",
  };
}
