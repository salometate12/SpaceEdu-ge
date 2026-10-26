import type { DailyGoal } from "@/lib/profile";
import { getCustomDecks } from "@/lib/custom-decks";
import { migrateGoals, pruneGoals, type SuggestionSources } from "@/lib/goals-card";
import { getDeckProgress } from "@/lib/progress";
import { localToday, readSavedPlan } from "@/lib/study-plan-board";
import { getSavedStudyPlan } from "@/lib/study-plan-calendar";
import { getDashboardCalendarEvents, getGeneratedMilestones } from "@/lib/syllabus-calendar";
import { DAILY_GOALS_KEY as STORAGE_KEY, DAILY_GOALS_UPDATED_EVENT } from "@/lib/user-data-keys";
import { userStore } from "@/lib/user-data";

/** Per-user goal list, each goal on its day. Starts empty — nothing is shown
 * until the student adds a goal. Kept on the account (lib/user-data). */

export { DAILY_GOALS_UPDATED_EVENT };

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** All stored goals (every kept day). Old ones are moved onto the current
 * model and saved back once, so this happens a single time. */
export function loadDailyGoals(): DailyGoal[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const { goals, changed } = migrateGoals(JSON.parse(raw), localToday());
    if (changed) userStore.set(STORAGE_KEY, goals);
    return goals;
  } catch {
    return [];
  }
}

export function saveDailyGoals(goals: DailyGoal[]): void {
  if (!isBrowser()) return;
  try {
    userStore.set(STORAGE_KEY, pruneGoals(goals, localToday()));
    window.dispatchEvent(new Event(DAILY_GOALS_UPDATED_EVENT));
  } catch {
    /* storage unavailable — goals are a convenience */
  }
}

/**
 * Where „შეთავაზებები გეგმიდან“ come from: today's study-plan day (the
 * student board first, then the dashboard calendar's plan), dated
 * deadlines from the syllabus and the calendar, and unlearned flashcards.
 */
export function readSuggestionSources(today: string): SuggestionSources {
  if (!isBrowser()) return { planDay: null, deadlines: [], cardsToReview: 0 };

  let planDay: SuggestionSources["planDay"] = null;
  const board = readSavedPlan();
  const boardDay = board?.plan.find((day) => day.date === today);
  if (board && boardDay && !board.done.includes(today)) {
    planDay = { date: today, tasks: boardDay.tasks, topics: boardDay.topics, hours: boardDay.hours };
  } else {
    const space = window.localStorage.getItem("spaceedu_space") === "abiturient" ? "abiturient" : "student";
    const saved = getSavedStudyPlan(space);
    const day = saved?.days.find((item) => item.date === today);
    if (saved && day && !saved.doneDates.includes(today)) {
      planDay = { date: today, tasks: day.tasks, topics: day.topics, hours: day.hours };
    }
  }

  const seen = new Set<string>();
  const deadlines: SuggestionSources["deadlines"] = [];
  for (const event of [...getDashboardCalendarEvents(), ...getGeneratedMilestones()]) {
    if (!event.date || event.type === "study" || seen.has(event.id)) continue;
    seen.add(event.id);
    deadlines.push({ id: event.id, title: event.title, date: event.date });
  }

  let cardsToReview = 0;
  for (const deck of getCustomDecks()) {
    const learned = new Set(getDeckProgress(deck.id).learnedCardIds);
    cardsToReview += deck.cards.filter((card) => !learned.has(card.id)).length;
  }

  return { planDay, deadlines, cardsToReview };
}
