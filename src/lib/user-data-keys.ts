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
export const AI_TEACHER_HISTORY_UPDATED_EVENT = "spaceedu-ai-teacher-history-updated";
export const ASSISTANT_HISTORY_UPDATED_EVENT = "spaceedu-assistant-history-updated";
export const CV_PREFS_UPDATED_EVENT = "spaceedu-cv-prefs-updated";
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
export const AI_TEACHER_HISTORY_KEYS = {
  student: "spaceedu-ai-teacher-conversations-student",
  abiturient: "spaceedu-ai-teacher-conversations-abiturient",
} as const;
/** Per assistant route: `spaceedu-assistant-history:/assistants/…`. */
export const ASSISTANT_HISTORY_KEY_BASE = "spaceedu-assistant-history";
export const CV_PREFS_KEY = "spaceedu-cv-prefs";

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
  { key: CUSTOM_DECKS_STORAGE_KEY, merge: unionById, event: CUSTOM_DECKS_UPDATED_EVENT },
  { key: AI_TEACHER_HISTORY_KEYS.student, merge: mergeNewestById("updatedAt", 50), event: AI_TEACHER_HISTORY_UPDATED_EVENT },
  { key: AI_TEACHER_HISTORY_KEYS.abiturient, merge: mergeNewestById("updatedAt", 50), event: AI_TEACHER_HISTORY_UPDATED_EVENT },
  { key: ASSISTANT_HISTORY_KEY_BASE, variants: true, merge: mergeNewestById("createdAt", 24), event: ASSISTANT_HISTORY_UPDATED_EVENT },
  { key: CV_PREFS_KEY, event: CV_PREFS_UPDATED_EVENT },
];
