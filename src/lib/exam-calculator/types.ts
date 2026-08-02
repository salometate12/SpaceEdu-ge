import type { PredictionStatus } from "./prediction-status";

export type ExamSubjectId =
  | "georgian"
  | "foreign_language"
  | "math"
  | "physics"
  | "chemistry"
  | "biology"
  | "history"
  | "geography"
  | "civics";

export interface ExamRequirement {
  subjectId: ExamSubjectId;
  minThreshold: number;
}

export interface HandbookProgram {
  code: string;
  institutionCode: string;
  faculty: string;
  slots: number | null;
  page: number;
  exams: {
    mandatory: ExamRequirement[];
    oneOf: ExamRequirement[][];
  };
}

export interface HandbookInstitution {
  code: string;
  hint: string | null;
  name: string | null;
  startPage: number;
}

export interface HandbookData {
  meta: {
    source: string;
    pageRange: string;
    extractedAt: string;
    programCount: number;
    institutionCount: number;
    unreadablePages: { page: number; code?: string; reason: string }[];
  };
  institutions: HandbookInstitution[];
  programs: HandbookProgram[];
}

export type UserScores = Partial<Record<ExamSubjectId, number>>;

export interface CalculatorMatch {
  code: string;
  institutionCode: string;
  university: string;
  faculty: string;
  slots: number | null;
  threshold: number;
  matchedSubjects: ExamSubjectId[];
  userScore: number;
  electiveSubject: string;
  status: PredictionStatus;
  statusLabel: string;
  advisoryMessage: string;
}

export interface CalculatorPrediction extends CalculatorMatch {
  compatibilityLabel: string;
}
