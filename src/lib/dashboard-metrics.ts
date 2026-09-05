import { getToolUsageEvents } from "./activity";

/**
 * Derives the student dashboard's headline stat cards from the signals we
 * already track locally (streak activity, tool usage) plus two lightweight
 * trackers this module owns (quiz results, CV updates). Everything is
 * per-user and per-browser — no server round-trip.
 */

const QUIZ_STATS_KEY = "spaceedu-quiz-stats";
const CV_UPDATED_KEY = "spaceedu-cv-updated-at";
const STREAK_KEY = "spaceedu-daily-streak";
const MAX_QUIZ_ATTEMPTS = 200;

export const DASHBOARD_METRICS_UPDATED_EVENT = "spaceedu-dashboard-metrics-updated";

interface QuizAttempt {
  /** epoch ms */
  at: number;
  correct: number;
  total: number;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function notify(): void {
  if (isBrowser()) window.dispatchEvent(new Event(DASHBOARD_METRICS_UPDATED_EVENT));
}

// ---- writers ---------------------------------------------------------------

function readQuizAttempts(): QuizAttempt[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(QUIZ_STATS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QuizAttempt[]) : [];
  } catch {
    return [];
  }
}

/** Call once when a quiz run finishes. */
export function recordQuizResult(correct: number, total: number): void {
  if (!isBrowser() || total <= 0) return;
  const next = [
    ...readQuizAttempts(),
    { at: Date.now(), correct: Math.max(0, Math.min(correct, total)), total },
  ].slice(-MAX_QUIZ_ATTEMPTS);
  try {
    window.localStorage.setItem(QUIZ_STATS_KEY, JSON.stringify(next));
  } catch {
    /* storage full — metric is best-effort */
  }
  notify();
}

/** Call when the user generates / regenerates their CV. */
export function recordCvUpdate(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(CV_UPDATED_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  notify();
}

// ---- readers --------------------------------------------------------------

function readStreakDates(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { activityDates?: string[] };
    return Array.isArray(parsed.activityDates) ? parsed.activityDates : [];
  } catch {
    return [];
  }
}

/** Monday 00:00 of the ISO week that contains `ref`, as epoch ms. */
function startOfIsoWeek(ref: Date): number {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dow);
  return d.getTime();
}

/** First day of the current academic semester, as epoch ms. Autumn starts
 * in September, spring in February — a good-enough split for a count. */
function startOfSemester(ref: Date): number {
  const year = ref.getFullYear();
  const month = ref.getMonth(); // 0-indexed
  const semesterStartMonth = month >= 8 ? 8 : 1; // Sep or Feb
  return new Date(year, semesterStartMonth, 1).getTime();
}

function startOfMonth(ref: Date, monthsBack = 0): number {
  return new Date(ref.getFullYear(), ref.getMonth() - monthsBack, 1).getTime();
}

export interface DashboardMetrics {
  /** Distinct active days in the current ISO week (0–7). */
  sessionsThisWeek: number;
  /** thisWeek − lastWeek active days. */
  sessionsDelta: number;
  /** Overall quiz accuracy %, or null if no quiz taken yet. */
  quizAccuracy: number | null;
  /** This-month accuracy minus last-month accuracy, in points; null if
   * either month has no attempts. */
  quizAccuracyDelta: number | null;
  /** Research-tool opens since the semester began. */
  researchThisSemester: number;
  /** Whole days since the CV was last generated, or null if never. */
  cvUpdatedDaysAgo: number | null;
}

export type ActivityCategory = "quiz" | "study" | "ai" | "cv" | "syllabus";

export interface ActivityEntry {
  category: ActivityCategory;
  title: string;
  /** epoch ms */
  at: number;
}

function activityCategory(toolId: string): ActivityCategory {
  if (toolId.includes("quiz")) return "quiz";
  if (toolId.includes("ai") || toolId.includes("teacher")) return "ai";
  if (toolId.includes("cv")) return "cv";
  if (toolId.includes("syllabus")) return "syllabus";
  return "study";
}

/** The student's most recent tool activity, newest first. Empty for a
 * brand-new user (the dashboard then shows a friendly placeholder). */
export function getRecentActivity(limit = 6): ActivityEntry[] {
  return getToolUsageEvents()
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
    .map((event) => ({
      category: activityCategory(event.toolId),
      title: event.toolTitle,
      at: event.timestamp,
    }));
}

export function computeDashboardMetrics(now: Date = new Date()): DashboardMetrics {
  // --- sessions this week vs last week ---
  const dates = readStreakDates();
  const thisWeekStart = startOfIsoWeek(now);
  const lastWeekStart = thisWeekStart - 7 * 86_400_000;
  let sessionsThisWeek = 0;
  let sessionsLastWeek = 0;
  for (const iso of dates) {
    const t = new Date(`${iso}T00:00:00`).getTime();
    if (Number.isNaN(t)) continue;
    if (t >= thisWeekStart) sessionsThisWeek += 1;
    else if (t >= lastWeekStart) sessionsLastWeek += 1;
  }

  // --- quiz accuracy ---
  const attempts = readQuizAttempts();
  const accuracyFor = (list: QuizAttempt[]): number | null => {
    const correct = list.reduce((sum, a) => sum + a.correct, 0);
    const total = list.reduce((sum, a) => sum + a.total, 0);
    return total > 0 ? Math.round((correct / total) * 100) : null;
  };
  const quizAccuracy = accuracyFor(attempts);
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(now, 1);
  const thisMonthAcc = accuracyFor(attempts.filter((a) => a.at >= thisMonthStart));
  const lastMonthAcc = accuracyFor(
    attempts.filter((a) => a.at >= lastMonthStart && a.at < thisMonthStart),
  );
  const quizAccuracyDelta =
    thisMonthAcc !== null && lastMonthAcc !== null ? thisMonthAcc - lastMonthAcc : null;

  // --- research this semester ---
  const semesterStart = startOfSemester(now);
  const researchThisSemester = getToolUsageEvents().filter(
    (event) => event.toolId === "research" && event.timestamp >= semesterStart,
  ).length;

  // --- CV last updated ---
  let cvUpdatedDaysAgo: number | null = null;
  if (isBrowser()) {
    const raw = window.localStorage.getItem(CV_UPDATED_KEY);
    const ts = raw ? Number(raw) : NaN;
    if (Number.isFinite(ts)) {
      const startOfToday = new Date(now).setHours(0, 0, 0, 0);
      const startOfThatDay = new Date(ts).setHours(0, 0, 0, 0);
      cvUpdatedDaysAgo = Math.max(
        0,
        Math.round((startOfToday - startOfThatDay) / 86_400_000),
      );
    }
  }

  return {
    sessionsThisWeek,
    sessionsDelta: sessionsThisWeek - sessionsLastWeek,
    quizAccuracy,
    quizAccuracyDelta,
    researchThisSemester,
    cvUpdatedDaysAgo,
  };
}
