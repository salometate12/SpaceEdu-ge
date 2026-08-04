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
    return JSON.parse(raw) as SavedStudyPlan;
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
  };
  window.localStorage.setItem(STUDY_PLAN_CALENDAR_KEY, JSON.stringify(record));
  notifyStudyPlanCalendarUpdated();
}

export function clearSavedStudyPlan(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STUDY_PLAN_CALENDAR_KEY);
  notifyStudyPlanCalendarUpdated();
}
