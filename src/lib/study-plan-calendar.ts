import { recordDailyActivity } from "./daily-streak";

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

const STUDY_PLAN_CALENDAR_KEY = "spaceedu-dashboard-study-plan";

export const STUDY_PLAN_CALENDAR_UPDATED_EVENT = "spaceedu-study-plan-calendar-updated";

function notifyStudyPlanCalendarUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STUDY_PLAN_CALENDAR_UPDATED_EVENT));
}

export function getSavedStudyPlan(): SavedStudyPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STUDY_PLAN_CALENDAR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedStudyPlan;
    return { ...parsed, doneDates: parsed.doneDates ?? [] };
  } catch {
    return null;
  }
}

export function saveStudyPlanToDashboard(
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
  window.localStorage.setItem(STUDY_PLAN_CALENDAR_KEY, JSON.stringify(record));
  notifyStudyPlanCalendarUpdated();
}

export function toggleStudyPlanDayDone(date: string): void {
  const current = getSavedStudyPlan();
  if (!current) return;
  const isDone = current.doneDates.includes(date);
  const nextDoneDates = isDone
    ? current.doneDates.filter((item) => item !== date)
    : [...current.doneDates, date];
  const next: SavedStudyPlan = { ...current, doneDates: nextDoneDates };
  window.localStorage.setItem(STUDY_PLAN_CALENDAR_KEY, JSON.stringify(next));
  notifyStudyPlanCalendarUpdated();
  if (!isDone) {
    recordDailyActivity();
  }
}

export function clearSavedStudyPlan(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STUDY_PLAN_CALENDAR_KEY);
  notifyStudyPlanCalendarUpdated();
}
