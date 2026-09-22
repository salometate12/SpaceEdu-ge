/**
 * National Exams — Chemistry interactive archive (real 2025 paper).
 *
 * The chemistry paper is two parts: 30 single-answer MCQs (1 point each) and
 * ten open tasks (31–40, 33 points). The open tasks bundle numbered sub-items;
 * every chemistry sub-item is an open answer (a formula, an IUPAC name, a
 * balanced equation, a filled table cell or a worked calculation) graded by AI
 * against the scheme's creditable criteria — which are additive, so the score
 * is the sum of the met criteria, exactly like the history/geography graders.
 *
 * Content note: every question, option and answer is transcribed verbatim from
 * the official NAEC booklet (ერთიანი ეროვნული გამოცდები, ქიმია, ივლისი 2025) and
 * its scoring scheme in `docs/exam-sources/chemistry/`. The MCQ answer key comes
 * from the positioned scoring grid; every open sub-item's point value, criteria
 * and model answer come from the scoring PDF; the short Georgian `explanation`
 * notes are SpaceEdu's own, as with the other archives. Structural formulas,
 * diagrams and reaction schemes that can't be written inline are shown as
 * figures cropped from the paper.
 */

import { CHEMISTRY_2025 } from "./chemistryExams2025";

export type ChemistryOptionLabel = "ა" | "ბ" | "გ" | "დ";

export interface ChemistryFigure {
  src: string;
  alt: string;
  caption?: string;
}

export interface ChemistryOption {
  label: ChemistryOptionLabel;
  /** Empty when the choice is a structure shown inside the question's figure. */
  text: string;
}

export interface ChemistryMcqQuestion {
  id: string;
  number: number; // 1–30
  prompt: string;
  figures?: ChemistryFigure[];
  options: ChemistryOption[];
  correctLabel: ChemistryOptionLabel;
  explanation: string;
  points: 1;
}

export interface ChemistryOpenCriterion {
  id: string;
  /** Verbatim creditable point from the scoring scheme. */
  description: string;
  points: number;
}

export interface ChemistryOpenSubItem {
  id: string; // "31.1", "39.2" …
  prompt: string;
  maxPoints: number;
  figures?: ChemistryFigure[];
  criteria: ChemistryOpenCriterion[];
  /** The scheme's model answer, shown on the results page. */
  modelAnswer?: string;
  /** Calculation sub-items ask for a full worked solution. */
  requiresCalculation?: boolean;
}

export interface ChemistryOpenTask {
  id: string; // "chem-2025-v1-t31"
  number: number; // 31–40
  instruction: string;
  points: number;
  figures?: ChemistryFigure[];
  subItems: ChemistryOpenSubItem[];
}

export interface ChemistryExamVariant {
  id: string; // "chemistry-2025-v1"
  label: string;
  year: number;
  durationSeconds: number; // 10800 (3ს)
  totalPoints: number; // 63
  mcq: ChemistryMcqQuestion[]; // 1–30
  open: ChemistryOpenTask[]; // 31–40
}

export interface ChemistryExamYear {
  year: number;
  variants: ChemistryExamVariant[];
}

/* -------------------------------------------------------------------------- */
/*                                 REGISTRY                                    */
/* -------------------------------------------------------------------------- */

export const CHEMISTRY_EXAM_YEARS: ChemistryExamYear[] = [CHEMISTRY_2025];

export function getChemistryExamYears(): ChemistryExamYear[] {
  return CHEMISTRY_EXAM_YEARS;
}

export function getChemistryVariant(variantId: string): ChemistryExamVariant | null {
  for (const year of CHEMISTRY_EXAM_YEARS) {
    const match = year.variants.find((v) => v.id === variantId);
    if (match) return match;
  }
  return null;
}

export function chemistryTaskMaxPoints(task: ChemistryOpenTask): number {
  return task.subItems.reduce((sum, s) => sum + s.maxPoints, 0);
}
