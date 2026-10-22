import { EXAM_COUNTDOWN_KEY } from "./user-data-keys";
import { userStore } from "./user-data";

export { EXAM_COUNTDOWN_UPDATED_EVENT } from "./user-data-keys";

const MIN_DAYS = 25;
const MAX_DAYS = 160;

/**
 * Placeholder exam countdown. Real exam-date-driven logic isn't wired up
 * yet, so we pick a plausible number once and persist it so it stays
 * stable across visits instead of re-randomizing on every render.
 */
export function getExamCountdownDays(): number {
  if (typeof window === "undefined") return MIN_DAYS;

  const stored = userStore.get<unknown>(EXAM_COUNTDOWN_KEY, null);
  if (typeof stored === "number" && Number.isFinite(stored)) return stored;

  const value = Math.floor(Math.random() * (MAX_DAYS - MIN_DAYS + 1)) + MIN_DAYS;
  userStore.set(EXAM_COUNTDOWN_KEY, value);
  return value;
}
