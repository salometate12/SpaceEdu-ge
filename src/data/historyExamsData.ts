/**
 * National Exams — History interactive archive (real 2025 papers).
 *
 * History papers are shaped like the maths ones — independent single-answer
 * questions plus open, source-based tasks graded against a criteria scheme —
 * not like the Georgian language paper (editing + bound-text essay). So this
 * archive follows `mathExamsData.ts`, and the exam runner follows
 * `MathExamSimulation.tsx`: NOTHING is revealed or graded mid-exam; the whole
 * paper is scored only when the student presses "დასრულება".
 *
 * Content note: the questions and the two source documents are transcribed
 * verbatim from the official NAEC booklets (ერთიანი ეროვნული გამოცდები,
 * ისტორია, ივლისი 2025) in `docs/exam-sources/history/`. The MCQ answer keys
 * and every open-task criterion are taken verbatim from the official scoring
 * schemes (`scoring-variant-N-2025.pdf`). The short "რატომ არის სწორი"
 * explanation on each MCQ is SpaceEdu's own worked note — the official scheme
 * ships only the answer letter — following the same convention as the Georgian
 * archive in `pastExams2025.ts`.
 */

import { HISTORY_2025 } from "./historyExams2025";

export type HistoryOptionLabel = "ა" | "ბ" | "გ" | "დ";

export interface HistoryOption {
  label: HistoryOptionLabel;
  text: string;
}

export interface HistoryMcqQuestion {
  id: string;
  /** "1".."35" or the sub-numbered "36.1".."36.6" — shown verbatim. */
  number: string;
  prompt: string;
  options: HistoryOption[];
  correctLabel: HistoryOptionLabel;
  /** SpaceEdu's own worked note (why this option is correct). */
  explanation: string;
  points: 1;
}

/** One creditable point of an open sub-item, taken verbatim from the scheme.
 *  The final sub-item score is the sum of the met criteria, capped at
 *  maxPoints — never the model's self-reported number. */
export interface HistoryOpenCriterion {
  id: string;
  /** The expected key point, verbatim from the scoring scheme. */
  description: string;
  points: number;
}

export interface HistoryOpenSubItem {
  id: string; // "37.1", "38.7", …
  prompt: string;
  maxPoints: number;
  criteria: HistoryOpenCriterion[];
  /** Verbatim "does not earn credit if…" conditions from the scheme. */
  noCreditNotes?: string[];
}

/** A source document a task is built on; `pages` keeps the paper's own page
 *  breaks so the runner can offer the same "go to page 1/2/3" tabs. */
export interface HistorySourceDocument {
  id: string;
  title: string;
  authorOrSource: string;
  pages: string[];
}

export interface HistoryOpenTask {
  id: string; // "hist-2025-v1-t37"
  number: number; // 37, 38
  title: string;
  /** The task's instruction line, verbatim from the paper. */
  instruction: string;
  points: number;
  sourceDocument?: HistorySourceDocument;
  subItems: HistoryOpenSubItem[];
}

export interface HistoryExamVariant {
  id: string; // "history-2025-v1"
  label: string; // "I ვარიანტი"
  year: number;
  durationSeconds: number;
  totalPoints: number;
  mcq: HistoryMcqQuestion[]; // 1–35 + 36.1–36.6
  open: HistoryOpenTask[]; // [37, 38]
}

export interface HistoryExamYear {
  year: number;
  variants: HistoryExamVariant[];
}

/* -------------------------------------------------------------------------- */
/*                                 REGISTRY                                    */
/* -------------------------------------------------------------------------- */

export const HISTORY_EXAM_YEARS: HistoryExamYear[] = [HISTORY_2025];

export function getHistoryExamYears(): HistoryExamYear[] {
  return HISTORY_EXAM_YEARS;
}

export function getHistoryVariant(variantId: string): HistoryExamVariant | null {
  for (const year of HISTORY_EXAM_YEARS) {
    const match = year.variants.find((v) => v.id === variantId);
    if (match) return match;
  }
  return null;
}

/** Total creditable points across a task's sub-items (sanity: equals task.points). */
export function historyTaskMaxPoints(task: HistoryOpenTask): number {
  return task.subItems.reduce((sum, item) => sum + item.maxPoints, 0);
}
