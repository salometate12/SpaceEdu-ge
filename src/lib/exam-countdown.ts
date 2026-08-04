const COUNTDOWN_KEY = "spaceedu-exam-countdown-days";

const MIN_DAYS = 25;
const MAX_DAYS = 160;

/**
 * Placeholder exam countdown. Real exam-date-driven logic isn't wired up
 * yet, so we pick a plausible number once and persist it so it stays
 * stable across visits instead of re-randomizing on every render.
 */
export function getExamCountdownDays(): number {
  if (typeof window === "undefined") return MIN_DAYS;

  const stored = window.localStorage.getItem(COUNTDOWN_KEY);
  if (stored) {
    const parsed = Number.parseInt(stored, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const value = Math.floor(Math.random() * (MAX_DAYS - MIN_DAYS + 1)) + MIN_DAYS;
  window.localStorage.setItem(COUNTDOWN_KEY, String(value));
  return value;
}
