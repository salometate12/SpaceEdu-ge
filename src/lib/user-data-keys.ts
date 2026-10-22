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

export const SEMESTER_SUBJECTS_STORAGE_KEY = "spaceedu-semester-subjects";
export const DASHBOARD_CALENDAR_KEY_BASE = "spaceedu-dashboard-calendar-events";
export const SYLLABUS_MILESTONES_KEY = "spaceedu-syllabus-generated-milestones";
export const STUDY_PLAN_KEYS = {
  abiturient: "spaceedu-dashboard-study-plan",
  student: "spaceedu-dashboard-study-plan-student",
} as const;
export const EXAM_COUNTDOWN_KEY = "spaceedu-exam-countdown-days";

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
];
