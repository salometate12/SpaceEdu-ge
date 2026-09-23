/**
 * National Exams — Civic Education interactive archive (real 2025 paper).
 *
 * The civics paper is richer than the science subjects: 24 single-answer MCQs
 * (1 pt each) plus six open tasks (25–30, 36 points) of several kinds —
 *   • 25: a matching task (match five principles to five ideologies), scored
 *     5 correct → 2 pts, 3–4 → 1, ≤2 → 0 (client-side);
 *   • 26: an error-correction task (find and fix 11 factual errors in a text),
 *     each fix worth 1 pt, AI-graded against the 11 known corrections;
 *   • 27–30: open reasoning tasks (a school project, an illustration analysis,
 *     an argumentation task, and a five-source analysis), whose sub-items are
 *     either multiple-choice (30.1, 30.2 — client-side) or AI-graded against the
 *     scheme's criteria.
 *
 * Content note: every question, option, source text and answer is transcribed
 * verbatim from the official NAEC booklet (ერთიანი ეროვნული გამოცდები,
 * სამოქალაქო განათლება, ივლისი 2025) and its scoring scheme in
 * `docs/exam-sources/civics/`. The MCQ answer key, matching key, the 11
 * error/correction pairs and every open sub-item's points and criteria come
 * from the scoring PDF; the short Georgian `explanation` notes are SpaceEdu's own.
 */

import { CIVICS_2025 } from "./civicsExams2025";

export type CivicsOptionLabel = "ა" | "ბ" | "გ" | "დ";

export interface CivicsFigure {
  src: string;
  alt: string;
  caption?: string;
}

export interface CivicsOption {
  label: CivicsOptionLabel;
  text: string;
}

export interface CivicsMcqQuestion {
  id: string;
  number: number; // 1–24
  prompt: string;
  figures?: CivicsFigure[];
  options: CivicsOption[];
  correctLabel: CivicsOptionLabel;
  explanation: string;
  points: 1;
}

export interface CivicsOpenCriterion {
  id: string;
  description: string;
  points: number;
}

/** A source quote shown above a task's sub-items (task 30 has five). */
export interface CivicsSourceText {
  label: string; // "წყარო N1"
  attribution?: string;
  figure?: CivicsFigure;
  text?: string;
}

/** One row of the matching task (25): a left principle → the correct ideology number. */
export interface CivicsMatchPair {
  leftLabel: string; // "ა".."ე"
  leftText: string;
  correctRight: string; // "1".."5"
}

export interface CivicsMatching {
  rightOptions: { value: string; text: string }[]; // the ideologies 1–5
  pairs: CivicsMatchPair[];
}

export interface CivicsOpenSubItem {
  id: string; // "25", "26", "28.3", "30.4" …
  prompt: string;
  maxPoints: number;
  figures?: CivicsFigure[];
  /** MCQ sub-item (30.1, 30.2): graded client-side. */
  options?: CivicsOption[];
  correctLabel?: CivicsOptionLabel;
  mcqExplanation?: string;
  /** Matching sub-item (25): graded client-side with the 5→2/3–4→1/≤2→0 rule. */
  matching?: CivicsMatching;
  /** Open sub-item: AI-graded against these criteria. */
  criteria?: CivicsOpenCriterion[];
  modelAnswer?: string;
}

export interface CivicsOpenTask {
  id: string; // "civ-2025-v1-t25"
  number: number; // 25–30
  instruction: string;
  points: number;
  figures?: CivicsFigure[];
  sourceTexts?: CivicsSourceText[];
  subItems: CivicsOpenSubItem[];
}

export interface CivicsExamVariant {
  id: string; // "civics-2025-v1"
  label: string;
  year: number;
  durationSeconds: number; // 11400 (3ს10წთ)
  totalPoints: number; // 60
  mcq: CivicsMcqQuestion[]; // 1–24
  open: CivicsOpenTask[]; // 25–30
}

export interface CivicsExamYear {
  year: number;
  variants: CivicsExamVariant[];
}

export function isCivicsMcqSubItem(
  item: CivicsOpenSubItem,
): item is CivicsOpenSubItem & { options: CivicsOption[]; correctLabel: CivicsOptionLabel } {
  return Array.isArray(item.options) && item.correctLabel != null;
}

export function isCivicsMatchingSubItem(
  item: CivicsOpenSubItem,
): item is CivicsOpenSubItem & { matching: CivicsMatching } {
  return item.matching != null;
}

/** Matching score: 5 correct → 2, 3–4 → 1, ≤2 → 0. */
export function civicsMatchingScore(matching: CivicsMatching, picks: Record<string, string>): number {
  const correct = matching.pairs.filter((p) => picks[p.leftLabel] === p.correctRight).length;
  if (correct === 5) return 2;
  if (correct >= 3) return 1;
  return 0;
}

/* -------------------------------------------------------------------------- */
/*                                 REGISTRY                                    */
/* -------------------------------------------------------------------------- */

export const CIVICS_EXAM_YEARS: CivicsExamYear[] = [CIVICS_2025];

export function getCivicsExamYears(): CivicsExamYear[] {
  return CIVICS_EXAM_YEARS;
}

export function getCivicsVariant(variantId: string): CivicsExamVariant | null {
  for (const year of CIVICS_EXAM_YEARS) {
    const match = year.variants.find((v) => v.id === variantId);
    if (match) return match;
  }
  return null;
}

export function civicsTaskMaxPoints(task: CivicsOpenTask): number {
  return task.subItems.reduce((sum, s) => sum + s.maxPoints, 0);
}
