/**
 * Which localStorage keys follow the account (lib/user-store), how two
 * copies of each are merged, and which window event makes the UI re-read it.
 * Event names live here (and are re-exported by their modules) so this list
 * needs no imports and is complete before anything else loads.
 */
import { newerWins, unionById, type Merge, type SyncSpec } from "./user-store";

export const CALENDAR_UPDATED_EVENT = "spaceedu-calendar-updated";
export const STUDY_PLAN_CALENDAR_UPDATED_EVENT = "spaceedu-study-plan-calendar-updated";
export const SEMESTER_SUBJECTS_UPDATED_EVENT = "spaceedu-semester-subjects-updated";
export const EXAM_COUNTDOWN_UPDATED_EVENT = "spaceedu-exam-countdown-updated";
export const LECTURE_NOTES_UPDATED_EVENT = "spaceedu-lecture-notes-updated";
export const ABIT_LECTURE_NOTES_UPDATED_EVENT = "spaceedu-abit-lecture-notes-updated";
export const CONSPECTUS_UPDATED_EVENT = "spaceedu-conspectus-updated";
export const CUSTOM_DECKS_UPDATED_EVENT = "spaceedu-custom-decks-updated";
export const QUIZZES_UPDATED_EVENT = "spaceedu-quizzes-updated";
export const AI_TEACHER_HISTORY_UPDATED_EVENT = "spaceedu-ai-teacher-history-updated";
export const ASSISTANT_HISTORY_UPDATED_EVENT = "spaceedu-assistant-history-updated";
export const CV_PREFS_UPDATED_EVENT = "spaceedu-cv-prefs-updated";
export const DAILY_GOALS_UPDATED_EVENT = "spaceedu-daily-goals-updated";
export const DAILY_QUESTS_UPDATED_EVENT = "spaceedu-daily-quests-updated";
export const STREAK_UPDATED_EVENT = "spaceedu-streak-updated";
export const CATEGORY_ACCURACY_UPDATED_EVENT = "spaceedu-category-accuracy-updated";
export const DASHBOARD_METRICS_UPDATED_EVENT = "spaceedu-dashboard-metrics-updated";
export const THEME_EVENT = "spaceedu-theme-change";
export const LANGUAGE_UPDATED_EVENT = "spaceedu-language-updated";
export const ANIMATIONS_UPDATED_EVENT = "spaceedu-animations-updated";
export const DASHBOARD_GOALS_TOGGLE_EVENT = "spaceedu-dashboard-goals-toggle";
export const NOTIFICATIONS_UPDATED_EVENT = "spaceedu-notifications-updated";
/** Fired (detail: { key }) only for values that came from the account —
 * for editors, which mustn't reload on their own saves. */
export const USER_DATA_REMOTE_EVENT = "spaceedu-user-data-remote";

export const SEMESTER_SUBJECTS_STORAGE_KEY = "spaceedu-semester-subjects";
export const DASHBOARD_CALENDAR_KEY_BASE = "spaceedu-dashboard-calendar-events";
export const SYLLABUS_MILESTONES_KEY = "spaceedu-syllabus-generated-milestones";
export const STUDY_PLAN_KEYS = {
  abiturient: "spaceedu-dashboard-study-plan",
  student: "spaceedu-dashboard-study-plan-student",
} as const;
export const EXAM_COUNTDOWN_KEY = "spaceedu-exam-countdown-days";
export const LECTURE_NOTES_STORAGE_KEY = "spaceedu-lecture-notes";
export const ABIT_LECTURE_NOTES_STORAGE_KEY = "spaceedu-abit-lecture-notes";
export const CONSPECTUS_STORAGE_KEY = "flashcards-conspectus";
export const CUSTOM_DECKS_STORAGE_KEY = "flashcards-custom-decks";
/** Saved quizzes (lib/quiz-library): the questions, kept for „ჩემი მასალები“. */
export const QUIZZES_KEY = "spaceedu-quizzes";
/** Every pass through a saved quiz, finished or not. */
export const QUIZ_ATTEMPTS_KEY = "spaceedu-quiz-attempts";
export const QUIZ_ATTEMPTS_LIMIT = 80;
export const AI_TEACHER_HISTORY_KEYS = {
  student: "spaceedu-ai-teacher-conversations-student",
  abiturient: "spaceedu-ai-teacher-conversations-abiturient",
} as const;
/** Per assistant route: `spaceedu-assistant-history:/assistants/…`. */
export const ASSISTANT_HISTORY_KEY_BASE = "spaceedu-assistant-history";
export const CV_PREFS_KEY = "spaceedu-cv-prefs";
export const DAILY_GOALS_KEY = "spaceedu-daily-goals";
export const DAILY_QUESTS_KEY = "spaceedu-daily-quests";
export const STREAK_KEY = "spaceedu-daily-streak";
export const DECK_PROGRESS_KEY = "flashcards-progress";
export const CATEGORY_ACCURACY_KEY = "spaceedu-category-accuracy";
export const QUIZ_STATS_KEY = "spaceedu-quiz-stats";
export const CV_UPDATED_KEY = "spaceedu-cv-updated-at";
export const TOOL_USAGE_KEY = "spaceedu-tool-usage";
/** Every counted action, tagged with its space: the one source for the stats pages and badges. */
export const ACTIVITY_LOG_KEY = "spaceedu-activity-log";
export const ACTIVITY_LOG_UPDATED_EVENT = "spaceedu-activity-log-updated";
/** How many events the log keeps (newest first), well under the 1 MB row limit. */
export const ACTIVITY_LOG_LIMIT = 2500;
/** Where the student is in each flashcard deck (lib/flashcard-session). */
export const FLASHCARD_SESSIONS_KEY = "spaceedu-flashcard-sessions";
export const FLASHCARD_SESSIONS_LIMIT = 40;
export const ACTIVE_SUBJECT_KEY = "spaceedu-active-subject";
export const JOURNAL_PROGRESS_KEY = "spaceedu-journal-progress";
/** Read as is by the first-paint script in layout.tsx: "light" | "dark" | "system". */
export const THEME_KEY = "theme";
export const LANGUAGE_KEY = "spaceedu-language";
export const ANIMATIONS_KEY = "spaceedu-animations";
export const DASHBOARD_GOALS_KEY = "spaceedu-dashboard-goals-enabled";
export const NOTIFICATIONS_KEY = "spaceedu-notifications";

/** { subjects: [{ id, name }], semesterLabel }: both sides' subjects; the
 * newer label. */
export const mergeSemesterSubjects: Merge = (local, remote, context) => {
  const l = (local ?? {}) as { subjects?: unknown; semesterLabel?: unknown };
  const r = (remote ?? {}) as { subjects?: unknown; semesterLabel?: unknown };
  return {
    subjects: unionById(l.subjects ?? [], r.subjects ?? [], context),
    semesterLabel: newerWins(l.semesterLabel, r.semesterLabel, context) ?? l.semesterLabel ?? r.semesterLabel ?? "",
  };
};

/** A saved study plan: the newer plan; for the same plan, days done on
 * either device stay done. */
export const mergeStudyPlan: Merge = (local, remote, context) => {
  const l = local as { savedAt?: string; doneDates?: string[] } | null;
  const r = remote as { savedAt?: string; doneDates?: string[] } | null;
  if (l && r && l.savedAt === r.savedAt) {
    return { ...r, doneDates: [...new Set([...(r.doneDates ?? []), ...(l.doneDates ?? [])])].sort() };
  }
  return newerWins(local, remote, context);
};

/**
 * Lists of `{ id }` items that carry a timestamp: every item from both
 * sides; for an id on both, the copy with the later `field` (an edited
 * note, a continued chat). `limit` keeps the newest that many, newest first.
 */
export function mergeNewestById(field: "updatedAt" | "createdAt", limit?: number): Merge {
  return (local, remote, context) => {
    if (!Array.isArray(local) || !Array.isArray(remote)) return newerWins(local, remote, context);
    type Item = { id?: unknown } & Record<string, unknown>;
    const stamp = (item: Item) => (typeof item?.[field] === "number" ? (item[field] as number) : 0);
    const merged = new Map<unknown, Item>();
    for (const item of [...(local as Item[]), ...(remote as Item[])]) {
      const current = merged.get(item?.id);
      if (!current || stamp(item) > stamp(current)) merged.set(item?.id, item);
    }
    const items = [...merged.values()];
    if (limit === undefined) return items;
    return items.sort((a, b) => stamp(b) - stamp(a)).slice(0, limit);
  };
}

// ---- Progress (PR 3): two devices may each have counted, so nothing that
// was earned on either is lost — dates and items are combined, counters
// take the larger value.

const asArray = (value: unknown): Record<string, unknown>[] => (Array.isArray(value) ? value : []);
const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);

/** Today's goals ({ id, text, done }): both devices' goals; done on either is done. */
export const mergeDailyGoals: Merge = (local, remote) => {
  const merged = new Map<unknown, Record<string, unknown>>();
  for (const goal of [...asArray(local), ...asArray(remote)]) {
    const current = merged.get(goal.id);
    merged.set(goal.id, current ? { ...current, done: Boolean(current.done) || Boolean(goal.done) } : goal);
  }
  return [...merged.values()];
};

/** { date, progress: { quest: n } }: the later day; on the same day, each
 * quest's larger progress. */
export const mergeDailyQuests: Merge = (local, remote) => {
  const l = asObject(local);
  const r = asObject(remote);
  if (l.date !== r.date) return String(l.date ?? "") > String(r.date ?? "") ? l : r;
  const progress: Record<string, number> = {};
  for (const source of [asObject(l.progress), asObject(r.progress)]) {
    for (const [quest, value] of Object.entries(source)) progress[quest] = Math.max(progress[quest] ?? 0, num(value));
  }
  return { date: l.date, progress };
};

/** { activityDates }: every day active on either device. */
export const mergeStreak: Merge = (local, remote) => ({
  activityDates: [
    ...new Set([...asArray(asObject(local).activityDates), ...asArray(asObject(remote).activityDates)].map(String)),
  ].sort(),
});

/** [{ deckId, learnedCardIds }]: per deck, cards learned on either device. */
export const mergeDeckProgress: Merge = (local, remote) => {
  const decks = new Map<unknown, Set<unknown>>();
  for (const deck of [...asArray(local), ...asArray(remote)]) {
    const cards = decks.get(deck.deckId) ?? new Set();
    asArray(deck.learnedCardIds).forEach((card) => cards.add(card));
    decks.set(deck.deckId, cards);
  }
  return [...decks].map(([deckId, cards]) => ({ deckId, learnedCardIds: [...cards] }));
};

/** { category: { correct, total } }: per category, the tally with more
 * attempts (counts from two devices can't be told apart to be summed). */
export const mergeCategoryAccuracy: Merge = (local, remote) => {
  const merged: Record<string, unknown> = { ...asObject(remote) };
  for (const [category, tally] of Object.entries(asObject(local))) {
    if (num(asObject(tally).total) >= num(asObject(merged[category]).total)) merged[category] = tally;
  }
  return merged;
};

/** Quiz results ({ at, correct, total }): both devices' results, oldest
 * first, the last 200. */
export const mergeQuizAttempts: Merge = (local, remote) => {
  const seen = new Map<string, Record<string, unknown>>();
  for (const attempt of [...asArray(local), ...asArray(remote)]) {
    seen.set(`${attempt.at}|${attempt.correct}|${attempt.total}`, attempt);
  }
  return [...seen.values()].sort((a, b) => num(a.at) - num(b.at)).slice(-200);
};

/** Tool usage ({ id, timestamp }): both devices' events, oldest first, the last 300. */
export const mergeToolUsage: Merge = (local, remote) => {
  const seen = new Map<unknown, Record<string, unknown>>();
  for (const event of [...asArray(local), ...asArray(remote)]) seen.set(event.id, event);
  return [...seen.values()].sort((a, b) => num(a.timestamp) - num(b.timestamp)).slice(-300);
};

/** The journal's { xp, streak, lastSaveDate, unlocked }: the larger XP; the
 * streak of whichever saved last; anything unlocked on either. */
export const mergeJournalProgress: Merge = (local, remote) => {
  const l = asObject(local);
  const r = asObject(remote);
  const lDate = String(l.lastSaveDate ?? "");
  const rDate = String(r.lastSaveDate ?? "");
  const latest = lDate === rDate ? (num(l.streak) >= num(r.streak) ? l : r) : lDate > rDate ? l : r;
  return {
    xp: Math.max(num(l.xp), num(r.xp)),
    streak: num(latest.streak),
    lastSaveDate: latest.lastSaveDate ?? null,
    unlocked: { ...asObject(r.unlocked), ...asObject(l.unlocked) },
  };
};

/** The earlier of two optional timestamps. */
const earliest = (a: unknown, b: unknown): string | null => {
  const values = [a, b].filter((value): value is string => typeof value === "string" && value.length > 0);
  return values.length === 0 ? null : values.sort()[0];
};

/**
 * The notifications list: every notification from both; read on either is
 * read, deleted on either stays deleted (the earlier time wins).
 */
export const mergeNotifications: Merge = (local, remote) => {
  const merged = new Map<unknown, Record<string, unknown>>();
  for (const item of [...asArray(local), ...asArray(remote)]) {
    const current = merged.get(item.id);
    if (!current) {
      merged.set(item.id, item);
      continue;
    }
    const next: Record<string, unknown> = { ...current };
    if ("read" in current || "read" in item) next.read = Boolean(current.read) || Boolean(item.read);
    if (current.readAt || item.readAt) next.readAt = earliest(current.readAt, item.readAt);
    if (current.deletedAt || item.deletedAt) next.deletedAt = earliest(current.deletedAt, item.deletedAt);
    merged.set(item.id, next);
  }
  return [...merged.values()];
};

/** A timestamp (the CV's last update): the later one. */
const later: Merge = (local, remote) => Math.max(num(local), num(remote));

/** The placeholder countdown is random per device; the account's first one stays. */
const keepRemote: Merge = (_local, remote) => remote;

export const SYNCED_KEYS: SyncSpec[] = [
  { key: SEMESTER_SUBJECTS_STORAGE_KEY, merge: mergeSemesterSubjects, event: SEMESTER_SUBJECTS_UPDATED_EVENT },
  // Per space: the base key (student) and `…:abiturient` / `…:school`.
  { key: DASHBOARD_CALENDAR_KEY_BASE, variants: true, merge: unionById, event: CALENDAR_UPDATED_EVENT },
  { key: SYLLABUS_MILESTONES_KEY, merge: unionById, event: CALENDAR_UPDATED_EVENT },
  { key: STUDY_PLAN_KEYS.abiturient, merge: mergeStudyPlan, event: STUDY_PLAN_CALENDAR_UPDATED_EVENT },
  { key: STUDY_PLAN_KEYS.student, merge: mergeStudyPlan, event: STUDY_PLAN_CALENDAR_UPDATED_EVENT },
  { key: EXAM_COUNTDOWN_KEY, merge: keepRemote, event: EXAM_COUNTDOWN_UPDATED_EVENT },
  // Content (PR 2).
  { key: LECTURE_NOTES_STORAGE_KEY, merge: mergeNewestById("updatedAt"), event: LECTURE_NOTES_UPDATED_EVENT },
  { key: ABIT_LECTURE_NOTES_STORAGE_KEY, merge: mergeNewestById("updatedAt"), event: ABIT_LECTURE_NOTES_UPDATED_EVENT },
  { key: CONSPECTUS_STORAGE_KEY, merge: mergeNewestById("createdAt", 20), event: CONSPECTUS_UPDATED_EVENT },
  { key: QUIZZES_KEY, merge: mergeNewestById("updatedAt"), event: QUIZZES_UPDATED_EVENT },
  { key: QUIZ_ATTEMPTS_KEY, merge: mergeNewestById("updatedAt", QUIZ_ATTEMPTS_LIMIT), event: QUIZZES_UPDATED_EVENT },
  // A deck generating on one device, renamed or deleted on another: the later edit wins.
  { key: CUSTOM_DECKS_STORAGE_KEY, merge: mergeNewestById("updatedAt"), event: CUSTOM_DECKS_UPDATED_EVENT },
  { key: AI_TEACHER_HISTORY_KEYS.student, merge: mergeNewestById("updatedAt", 50), event: AI_TEACHER_HISTORY_UPDATED_EVENT },
  { key: AI_TEACHER_HISTORY_KEYS.abiturient, merge: mergeNewestById("updatedAt", 50), event: AI_TEACHER_HISTORY_UPDATED_EVENT },
  { key: ASSISTANT_HISTORY_KEY_BASE, variants: true, merge: mergeNewestById("createdAt", 24), event: ASSISTANT_HISTORY_UPDATED_EVENT },
  { key: CV_PREFS_KEY, event: CV_PREFS_UPDATED_EVENT },
  // Progress (PR 3).
  { key: DAILY_GOALS_KEY, merge: mergeDailyGoals, event: DAILY_GOALS_UPDATED_EVENT },
  { key: DAILY_QUESTS_KEY, merge: mergeDailyQuests, event: DAILY_QUESTS_UPDATED_EVENT },
  { key: STREAK_KEY, merge: mergeStreak, event: STREAK_UPDATED_EVENT },
  { key: DECK_PROGRESS_KEY, merge: mergeDeckProgress },
  { key: CATEGORY_ACCURACY_KEY, merge: mergeCategoryAccuracy, event: CATEGORY_ACCURACY_UPDATED_EVENT },
  { key: QUIZ_STATS_KEY, merge: mergeQuizAttempts, event: DASHBOARD_METRICS_UPDATED_EVENT },
  { key: CV_UPDATED_KEY, merge: later, event: DASHBOARD_METRICS_UPDATED_EVENT },
  { key: TOOL_USAGE_KEY, merge: mergeToolUsage, event: DASHBOARD_METRICS_UPDATED_EVENT },
  { key: ACTIVITY_LOG_KEY, merge: mergeNewestById("createdAt", ACTIVITY_LOG_LIMIT), event: ACTIVITY_LOG_UPDATED_EVENT },
  { key: FLASHCARD_SESSIONS_KEY, merge: mergeNewestById("updatedAt", FLASHCARD_SESSIONS_LIMIT) },
  { key: ACTIVE_SUBJECT_KEY, event: SEMESTER_SUBJECTS_UPDATED_EVENT },
  // The dashboard's journal widget shows the XP and re-reads on this event.
  { key: JOURNAL_PROGRESS_KEY, merge: mergeJournalProgress, event: LECTURE_NOTES_UPDATED_EVENT },
  // Settings: the same on every device; preferences, so they stay on the
  // device after sign-out. Stored as bare text, as before.
  { key: THEME_KEY, raw: true, keepOnSignOut: true, event: THEME_EVENT },
  { key: LANGUAGE_KEY, raw: true, keepOnSignOut: true, event: LANGUAGE_UPDATED_EVENT },
  { key: ANIMATIONS_KEY, raw: true, keepOnSignOut: true, event: ANIMATIONS_UPDATED_EVENT },
  { key: DASHBOARD_GOALS_KEY, raw: true, event: DASHBOARD_GOALS_TOGGLE_EVENT },
  { key: NOTIFICATIONS_KEY, merge: mergeNotifications, event: NOTIFICATIONS_UPDATED_EVENT },
];
