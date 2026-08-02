import type { ExamSubjectId } from "./types";

export interface ScoreField {
  id: ExamSubjectId;
  label: string;
  maxScore: number;
  required?: boolean;
}

export const SCORE_FIELDS: ScoreField[] = [
  { id: "georgian", label: "ქართული ენა და ლიტერატურა", maxScore: 60, required: true },
  { id: "foreign_language", label: "ინგლისური ენა", maxScore: 60, required: true },
  { id: "math", label: "მათემატიკა", maxScore: 51 },
  { id: "history", label: "ისტორია", maxScore: 60 },
  { id: "physics", label: "ფიზიკა", maxScore: 51 },
  { id: "chemistry", label: "ქიმია", maxScore: 60 },
  { id: "biology", label: "ბიოლოგია", maxScore: 60 },
  { id: "geography", label: "გეოგრაფია", maxScore: 60 },
  { id: "civics", label: "სამოქალაქო", maxScore: 60 },
];

const SUBJECT_LABELS: Record<ExamSubjectId, string> = Object.fromEntries(
  SCORE_FIELDS.map((f) => [f.id, f.label]),
) as Record<ExamSubjectId, string>;

export function subjectLabel(id: ExamSubjectId): string {
  return SUBJECT_LABELS[id] ?? id;
}

/** Normalize API / form payload keys to handbook subject ids. */
export function normalizeScores(
  input: Record<string, number | undefined>,
): Partial<Record<ExamSubjectId, number>> {
  const alias: Record<string, ExamSubjectId> = {
    georgian: "georgian",
    "ქართული ენა და ლიტერატურა": "georgian",
    foreign_language: "foreign_language",
    english: "foreign_language",
    "ინგლისური ენა": "foreign_language",
    math: "math",
    მათემატიკა: "math",
    history: "history",
    ისტორია: "history",
    physics: "physics",
    ფიზიკა: "physics",
    chemistry: "chemistry",
    ქიმია: "chemistry",
    biology: "biology",
    ბიოლოგია: "biology",
    geography: "geography",
    გეოგრაფია: "geography",
    civics: "civics",
    სამოქალაქო: "civics",
  };

  const out: Partial<Record<ExamSubjectId, number>> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value == null || Number.isNaN(value)) continue;
    const id = alias[key.trim()];
    if (id) out[id] = value;
  }
  return out;
}
