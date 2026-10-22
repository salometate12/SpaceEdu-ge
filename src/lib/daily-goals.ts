import type { DailyGoal } from "@/lib/profile";
import { DAILY_GOALS_KEY as STORAGE_KEY, DAILY_GOALS_UPDATED_EVENT } from "@/lib/user-data-keys";
import { userStore } from "@/lib/user-data";

/** Per-user goal list. Starts empty — nothing is shown until the student
 * adds a goal or generates some with AI. Kept on the account (lib/user-data). */

export { DAILY_GOALS_UPDATED_EVENT };

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
    userStore.set(STORAGE_KEY, goals);
    window.dispatchEvent(new Event(DAILY_GOALS_UPDATED_EVENT));
  } catch {
    /* storage unavailable — goals are a convenience */
  }
}
