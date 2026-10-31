import { SEMESTER_SUBJECTS_STORAGE_KEY } from "./user-data-keys";
import { userStore } from "./user-data";

export { SEMESTER_SUBJECTS_STORAGE_KEY, SEMESTER_SUBJECTS_UPDATED_EVENT } from "./user-data-keys";

export interface SemesterSubject {
  id: string;
  name: string;
  /** ECTS credits, when the student gives them („ჩემი საგნები“). */
  credits?: number;
  /** A tag colour index (SUBJECT_TAG_COLORS), when chosen. */
  color?: number;
}

export const DEFAULT_SEMESTER_SUBJECTS: SemesterSubject[] = [
  { id: "default-1", name: "მონაცემთა სტრუქტურები" },
  { id: "default-2", name: "ალგორითმები" },
  { id: "default-3", name: "მათემატიკა" },
  { id: "default-4", name: "სტატისტიკა" },
];

export const SUBJECT_TAG_COLORS = [
  { bg: "#efe9fe", text: "#5b21b6" },
  { bg: "#dbeafe", text: "#1e3a8a" },
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#d1fae5", text: "#065f46" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#cffafe", text: "#0e7490" },
];

export interface SemesterSubjectsData {
  subjects: SemesterSubject[];
  semesterLabel: string;
}

export function readSemesterSubjects(): SemesterSubjectsData {
  const parsed = userStore.get<Partial<SemesterSubjectsData> | null>(SEMESTER_SUBJECTS_STORAGE_KEY, null);
  if (!parsed) return { subjects: DEFAULT_SEMESTER_SUBJECTS, semesterLabel: "" };
  return {
    subjects: Array.isArray(parsed.subjects) ? parsed.subjects : DEFAULT_SEMESTER_SUBJECTS,
    semesterLabel: parsed.semesterLabel ?? "",
  };
}

/** Saves on this device and on the account. */
export function saveSemesterSubjects(data: SemesterSubjectsData) {
  userStore.set(SEMESTER_SUBJECTS_STORAGE_KEY, data);
}
