export interface SemesterSubject {
  id: string;
  name: string;
}

export const SEMESTER_SUBJECTS_STORAGE_KEY = "spaceedu-semester-subjects";

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
  if (typeof window === "undefined") {
    return { subjects: DEFAULT_SEMESTER_SUBJECTS, semesterLabel: "" };
  }
  try {
    const raw = window.localStorage.getItem(SEMESTER_SUBJECTS_STORAGE_KEY);
    if (!raw) {
      return { subjects: DEFAULT_SEMESTER_SUBJECTS, semesterLabel: "" };
    }
    const parsed = JSON.parse(raw) as Partial<SemesterSubjectsData>;
    return {
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : DEFAULT_SEMESTER_SUBJECTS,
      semesterLabel: parsed.semesterLabel ?? "",
    };
  } catch {
    return { subjects: DEFAULT_SEMESTER_SUBJECTS, semesterLabel: "" };
  }
}
