/**
 * „ჩემი მიზნები“ as pure helpers: reading stored goals (and moving old ones
 * onto the current model), the day's list, the line under the ring, and
 * the one-tap suggestions from the plan, the syllabus and the flashcards.
 */
import type { DailyGoal, GoalCategory } from "@/lib/profile";

export const GOAL_CATEGORIES: GoalCategory[] = ["study", "read", "task", "other"];

export const GOAL_CATEGORY_LABEL: Record<GoalCategory, string> = {
  study: "სწავლა",
  read: "კითხვა",
  task: "დავალება",
  other: "სხვა",
};

export const GOAL_CATEGORY_COLOR: Record<GoalCategory, string> = {
  study: "#ec4899",
  read: "#38bdf8",
  task: "#facc15",
  other: "#4ade80",
};

export const GOAL_MINUTES = [15, 20, 30] as const;

/** Rows shown before „კიდევ N“. */
export const VISIBLE_GOALS = 5;

/** Goals older than this are dropped when the list is saved. */
const KEEP_DAYS = 14;

/**
 * A category from anything stored: today's four as they are, the old
 * quiz/chat ones mapped (a quiz is studying, a chat is „სხვა“), and
 * anything unknown or missing as „სხვა“.
 */
export function goalCategory(raw: unknown): GoalCategory {
  switch (raw) {
    case "study":
    case "quiz":
      return "study";
    case "read":
      return "read";
    case "task":
      return "task";
    default:
      return "other";
  }
}

/**
 * Stored goals on the current model. Old goals have no day — they're
 * today's — and may carry an old category. `changed` says whether anything
 * was moved, so the caller can save it back once.
 */
export function migrateGoals(raw: unknown, today: string): { goals: DailyGoal[]; changed: boolean } {
  if (!Array.isArray(raw)) return { goals: [], changed: false };
  let changed = false;
  const goals: DailyGoal[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      changed = true;
      continue;
    }
    const goal = item as Record<string, unknown>;
    if (typeof goal.text !== "string" || typeof goal.id !== "string") {
      changed = true;
      continue;
    }
    const type = goalCategory(goal.type);
    const date = typeof goal.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(goal.date) ? goal.date : today;
    const minutes = typeof goal.minutes === "number" && goal.minutes > 0 ? goal.minutes : undefined;
    const source = typeof goal.source === "string" ? goal.source : undefined;
    if (type !== goal.type || date !== goal.date) changed = true;
    goals.push({
      id: goal.id,
      text: goal.text,
      done: Boolean(goal.done),
      type,
      date,
      ...(minutes ? { minutes } : {}),
      ...(source ? { source } : {}),
    });
  }
  return { goals, changed };
}

const toUtc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

export function shiftDay(iso: string, days: number): string {
  return new Date(toUtc(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Drops goals from more than two weeks ago. */
export function pruneGoals(goals: DailyGoal[], today: string): DailyGoal[] {
  const oldest = shiftDay(today, -KEEP_DAYS);
  return goals.filter((goal) => goal.date >= oldest);
}

/** The day's goals: open ones first, done ones sink; each keeps its order. */
export function goalsForDay(goals: DailyGoal[], day: string): DailyGoal[] {
  const ofDay = goals.filter((goal) => goal.date === day);
  return [...ofDay.filter((goal) => !goal.done), ...ofDay.filter((goal) => goal.done)];
}

/** Yesterday's goals left open — offered to bring over to today. */
export function unfinishedYesterday(goals: DailyGoal[], today: string): DailyGoal[] {
  const yesterday = shiftDay(today, -1);
  return goals.filter((goal) => goal.date === yesterday && !goal.done);
}

/** Moves yesterday's open goals onto today. */
export function carryOver(goals: DailyGoal[], today: string): DailyGoal[] {
  const yesterday = shiftDay(today, -1);
  return goals.map((goal) => (goal.date === yesterday && !goal.done ? { ...goal, date: today } : goal));
}

export type GoalMotivation =
  | { kind: "empty" }
  | { kind: "all-done" }
  | { kind: "streak-kept"; streak: number }
  | { kind: "to-go"; remaining: number; nextStreak: number };

/**
 * The line under the ring. Finishing every goal counts the day for the
 * streak, so while some are left it says what the streak becomes — unless
 * something else (a quiz, the plan) already counted today.
 */
export function goalMotivation({
  total,
  done,
  streak,
  activeToday,
}: {
  total: number;
  done: number;
  streak: number;
  activeToday: boolean;
}): GoalMotivation {
  if (total === 0) return { kind: "empty" };
  if (done >= total) return { kind: "all-done" };
  if (activeToday) return { kind: "streak-kept", streak: Math.max(streak, 1) };
  return { kind: "to-go", remaining: total - done, nextStreak: streak + 1 };
}

export interface GoalSuggestion {
  /** Stable per day, kept on the goal it becomes so it isn't offered again. */
  key: string;
  text: string;
  type: GoalCategory;
  minutes?: number;
}

export interface SuggestionSources {
  /** Today's study-plan day, when there is one and it isn't done. */
  planDay?: { date: string; tasks: string[]; topics: string[]; hours: number } | null;
  /** Dated deadlines (exams, quizzes, hand-ins) from the syllabus and calendar. */
  deadlines: { id: string; title: string; date: string; subject?: string }[];
  /** Flashcards not learned yet, across the student's decks. */
  cardsToReview: number;
}

/** Plan time split across the day's tasks, in whole 5 minutes (10–90). */
function taskMinutes(hours: number, count: number): number | undefined {
  if (!hours || count <= 0) return undefined;
  const each = Math.round((hours * 60) / count / 5) * 5;
  return Math.min(90, Math.max(10, each));
}

/**
 * Up to three one-tap goals: the plan's tasks for today, the nearest
 * deadline in the next three days, and a flashcard review. Ones already
 * added today (or done) aren't offered again.
 */
export function goalSuggestions(sources: SuggestionSources, goals: DailyGoal[], today: string, limit = 3): GoalSuggestion[] {
  const todays = goals.filter((goal) => goal.date === today);
  const usedKeys = new Set(todays.map((goal) => goal.source).filter(Boolean));
  const usedTexts = new Set(todays.map((goal) => goal.text.trim().toLowerCase()));
  const out: GoalSuggestion[] = [];
  const push = (suggestion: GoalSuggestion) => {
    if (usedKeys.has(suggestion.key) || usedTexts.has(suggestion.text.trim().toLowerCase())) return;
    if (out.some((item) => item.key === suggestion.key)) return;
    out.push(suggestion);
  };

  const day = sources.planDay;
  if (day && day.date === today) {
    const tasks = day.tasks.length > 0 ? day.tasks : day.topics;
    const minutes = taskMinutes(day.hours, tasks.length);
    tasks.forEach((task, index) => {
      const text = task.trim();
      if (text) push({ key: `plan:${today}:${index}`, text, type: "study", minutes });
    });
  }

  const nearest = sources.deadlines
    .filter((item) => item.date >= today && item.date <= shiftDay(today, 3))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (nearest) {
    const days = Math.round((toUtc(nearest.date) - toUtc(today)) / 86_400_000);
    const when = days === 0 ? "დღეს" : days === 1 ? "ხვალ" : `${days} დღეში`;
    push({ key: `deadline:${nearest.id}`, text: `მოემზადე: ${nearest.title} (${when})`, type: "task", minutes: 30 });
  }

  if (sources.cardsToReview > 0) {
    push({ key: `cards:${today}`, text: "ბარათების გამეორება", type: "read", minutes: 10 });
  }

  // The plan can fill all three; keep room for the deadline and the cards.
  const plan = out.filter((item) => item.key.startsWith("plan:"));
  const rest = out.filter((item) => !item.key.startsWith("plan:"));
  return [...plan.slice(0, Math.max(1, limit - rest.length)), ...rest].slice(0, limit);
}
