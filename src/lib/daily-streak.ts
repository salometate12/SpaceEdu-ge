const STREAK_KEY = "spaceedu-daily-streak";

export const STREAK_UPDATED_EVENT = "spaceedu-streak-updated";

interface StreakState {
  activityDates: string[];
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function readActivityDates(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StreakState;
    return Array.isArray(parsed.activityDates) ? parsed.activityDates : [];
  } catch {
    return [];
  }
}

/**
 * Records that the user completed a streak-worthy activity today
 * (finishing a quiz, checking off a study-plan day, completing a
 * flashcard study session, etc). Safe to call multiple times per day —
 * dates are deduped.
 */
export function recordDailyActivity(): void {
  if (typeof window === "undefined") return;
  const today = todayIso();
  const dates = readActivityDates();
  if (dates.includes(today)) return;

  const next = [...dates, today].sort();
  window.localStorage.setItem(STREAK_KEY, JSON.stringify({ activityDates: next }));
  window.dispatchEvent(new Event(STREAK_UPDATED_EVENT));
}

/**
 * Current streak length in days. Counts consecutive calendar days with
 * recorded activity, anchored at today (if already active) or yesterday
 * (grace period — streak isn't broken until a full day is missed).
 */
export function getCurrentStreak(): number {
  const dates = new Set(readActivityDates());
  if (dates.size === 0) return 0;

  const activeToday = dates.has(todayIso());
  if (!activeToday && !dates.has(isoDaysAgo(1))) return 0;

  let streak = 0;
  let offset = activeToday ? 0 : 1;
  while (dates.has(isoDaysAgo(offset))) {
    streak += 1;
    offset += 1;
  }
  return streak;
}

/** Longest run of consecutive active days ever recorded (personal best). */
export function getLongestStreak(): number {
  const sorted = [...new Set(readActivityDates())].sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const iso of sorted) {
    const t = new Date(`${iso}T00:00:00`).getTime();
    if (Number.isNaN(t)) continue;
    if (prev !== null && Math.round((t - prev) / 86_400_000) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > best) best = run;
    prev = t;
  }
  return best;
}

/** ISO date strings the student was active on within the current ISO week. */
export function getActiveDatesThisWeek(): string[] {
  const dates = new Set(readActivityDates());
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const week: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    if (dates.has(iso)) week.push(iso);
  }
  return week;
}

export function getTotalActiveDays(): number {
  return new Set(readActivityDates()).size;
}
