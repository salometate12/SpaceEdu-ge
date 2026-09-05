import type { DailyGoal } from "@/lib/profile";

/** Per-user goal list. Starts empty — nothing is shown until the student
 * adds a goal or generates some with AI. Persisted to localStorage. */

const STORAGE_KEY = "spaceedu-daily-goals";

export const DAILY_GOALS_UPDATED_EVENT = "spaceedu-daily-goals-updated";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadDailyGoals(): DailyGoal[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DailyGoal[];
    return Array.isArray(parsed) ? parsed.filter((g) => g && typeof g.text === "string") : [];
  } catch {
    return [];
  }
}

export function saveDailyGoals(goals: DailyGoal[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    window.dispatchEvent(new Event(DAILY_GOALS_UPDATED_EVENT));
  } catch {
    /* storage unavailable — goals are a convenience */
  }
}
