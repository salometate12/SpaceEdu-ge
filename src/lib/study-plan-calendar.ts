import { recordDailyActivity } from "./daily-streak";

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
