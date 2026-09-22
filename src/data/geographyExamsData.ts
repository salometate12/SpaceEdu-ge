/**
 * National Exams — Geography interactive archive (real 2025 paper).
 *
 * The geography paper is two parts: 27 single-answer MCQs (1 point each) and
 * ten open tasks (28–37, 32 points). Many open tasks bundle several numbered
 * sub-items, and some of those sub-items are themselves multiple-choice
 * (e.g. 28.1, 28.2, 35.1, 37.1, 37.2) while the rest are short open answers
 * (a named term, a calculation, or a source-based explanation). So a sub-item
 * carries EITHER `options`/`correctLabel` (graded client-side, letter compare)
 * OR `criteria`/`modelAnswer` (graded by AI against the scheme).
 *
 * Content note: every question, option and answer is transcribed verbatim from
 * the official NAEC booklet (ერთიანი ეროვნული გამოცდები, გეოგრაფია, ივლისი 2025)
 * and its scoring scheme in `docs/exam-sources/geography/`. The MCQ answer key
 * and every open sub-item's point value, criteria and "სწორი პასუხის ნიმუში"
 * come straight from the scoring PDF; the short Georgian `explanation` notes are
 * SpaceEdu's own, as with the history and English archives.
 */

import { GEOGRAPHY_2025 } from "./geographyExams2025";

export type GeographyOptionLabel = "ა" | "ბ" | "გ" | "დ";

export interface GeographyFigure {
  src: string;
  alt: string;
  /** The source type (map / photo / chart …) — helps the AI judge source-based answers. */
  caption?: string;
}

export interface GeographyOption {
  label: GeographyOptionLabel;
  /** Empty when the choice is a labelled image inside the question's figure. */
  text: string;
}

export interface GeographyMcqQuestion {
  id: string;
  number: number; // 1–27
  prompt: string;
  figures?: GeographyFigure[];
  options: GeographyOption[];
  correctLabel: GeographyOptionLabel;
  explanation: string;
  points: 1;
}

export interface GeographyOpenCriterion {
  id: string;
  /** Verbatim creditable point from the scoring scheme. */
  description: string;
  points: number;
}

export interface GeographyOpenSubItem {
  id: string; // "28.1", "36.4" …
  prompt: string;
  maxPoints: number;
  figures?: GeographyFigure[];
  /** MCQ sub-item: pick a letter (graded client-side). */
  options?: GeographyOption[];
  correctLabel?: GeographyOptionLabel;
  /** SpaceEdu's note shown after an MCQ sub-item is revealed. */
  mcqExplanation?: string;
  /** Open sub-item: graded by AI against these creditable criteria. */
  criteria?: GeographyOpenCriterion[];
  /** The scheme's "სწორი პასუხის ნიმუში" (model answer), shown on the results page. */
  modelAnswer?: string;
  /** Some open sub-items ask for a worked calculation. */
  requiresCalculation?: boolean;
}

export interface GeographyOpenTask {
  id: string; // "geo-2025-v1-t28"
  number: number; // 28–37
  instruction: string;
  points: number;
  /** Shared source(s) the sub-items refer to (topographic map, diagrams …). */
  figures?: GeographyFigure[];
  subItems: GeographyOpenSubItem[];
}

export interface GeographyExamVariant {
  id: string; // "geography-2025-v1"
  label: string; // "I ვარიანტი"
  year: number;
  durationSeconds: number; // 9600 (2ს40წთ)
  totalPoints: number; // 59
  mcq: GeographyMcqQuestion[]; // 1–27
  open: GeographyOpenTask[]; // 28–37
}

export interface GeographyExamYear {
  year: number;
  variants: GeographyExamVariant[];
}

/** True when the sub-item is a multiple-choice one (graded client-side). */
export function isGeographyMcqSubItem(
  item: GeographyOpenSubItem,
): item is GeographyOpenSubItem & { options: GeographyOption[]; correctLabel: GeographyOptionLabel } {
  return Array.isArray(item.options) && item.correctLabel != null;
}

/* -------------------------------------------------------------------------- */
/*                                 REGISTRY                                    */
/* -------------------------------------------------------------------------- */

export const GEOGRAPHY_EXAM_YEARS: GeographyExamYear[] = [GEOGRAPHY_2025];

export function getGeographyExamYears(): GeographyExamYear[] {
  return GEOGRAPHY_EXAM_YEARS;
}

export function getGeographyVariant(variantId: string): GeographyExamVariant | null {
  for (const year of GEOGRAPHY_EXAM_YEARS) {
    const match = year.variants.find((v) => v.id === variantId);
    if (match) return match;
  }
  return null;
}

/** Sum of a task's sub-item maxima (its total points). */
export function geographyTaskMaxPoints(task: GeographyOpenTask): number {
  return task.subItems.reduce((sum, s) => sum + s.maxPoints, 0);
}
