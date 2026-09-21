/**
 * National Exams — English interactive archive (real 2025 papers).
 *
 * The English paper is seven tasks: six deterministic answer-key tasks (a
 * letter per numbered item) plus one essay graded by AI. Tasks 1/3/5 are
 * "standalone" — every numbered item carries its own A–D options — while
 * tasks 2/4/6 are "matching": all items share one bank of options (paragraphs
 * A–F, words A–N, sentences A–H) alongside a shared text/dialogue. So both
 * shapes reduce to items of { number, prompt, options, correctLabel } and the
 * task wraps the audio / passage / bank around them.
 *
 * Content note: the tasks, texts and answer keys are transcribed verbatim from
 * the official NAEC booklets (ერთიანი ეროვნული გამოცდები, ინგლისური ენა,
 * ივლისი 2025) and answer key in `docs/exam-sources/english/`. The short
 * "why this answer is correct" note on each item is SpaceEdu's own worked note
 * — the official key ships only the letter — following the convention of the
 * Georgian and history archives. Task 7 carries a SpaceEdu-authored 16-point
 * rubric, since the exam publishes no official essay criteria.
 */

import { ENGLISH_2025 } from "./englishExams2025";

export interface EnglishOption {
  /** "A".."N" — the bank grows to 14 in the vocabulary task. */
  label: string;
  text: string;
}

export interface EnglishItem {
  id: string;
  number: number;
  /** The question text; empty for a pure gap (tasks 4/6, where the gap sits in
   *  the shared text and the number marks its place). */
  prompt: string;
  options: EnglishOption[];
  correctLabel: string;
  /** SpaceEdu's own worked note. */
  explanation: string;
}

export type EnglishTaskKind =
  | "listening" // Task 1
  | "matching" // Task 2
  | "reading" // Task 3
  | "vocabulary" // Task 4
  | "grammar" // Task 5
  | "dialogue"; // Task 6

export interface EnglishTask {
  id: string;
  number: number; // 1–6
  kind: EnglishTaskKind;
  title: string;
  instruction: string;
  points: number;
  /** Task 1 only. */
  audioSrc?: string;
  /** Task 1 only — how many times the recording may be replayed in the real
   *  exam ("You will then hear the recording twice"). */
  playsAllowed?: number;
  /** Task 3 — the reading passage. */
  passageText?: string;
  /** Task 2 — the labelled paragraphs the questions match to. */
  paragraphs?: { label: string; text: string }[];
  /** Task 4/6 — the gapped text / dialogue, with (n) marking each gap. */
  sharedText?: string;
  /** Task 2/4/6 — the one bank of options every item shares. */
  bank?: EnglishOption[];
  items: EnglishItem[];
}

export interface EnglishEssayTask {
  id: string;
  number: 7;
  prompt: string;
  minWords: number;
  maxWords: number;
  points: number;
}

export interface EnglishExamVariant {
  id: string; // "english-2025-v1"
  label: string;
  year: number;
  durationSeconds: number; // 9000 (2ს30წთ)
  totalPoints: number; // 70
  /** Tasks 1–6 in order. */
  tasks: EnglishTask[];
  essay: EnglishEssayTask; // Task 7
}

export interface EnglishExamYear {
  year: number;
  variants: EnglishExamVariant[];
}

/* -------------------------------------------------------------------------- */
/*                                 REGISTRY                                    */
/* -------------------------------------------------------------------------- */

export const ENGLISH_EXAM_YEARS: EnglishExamYear[] = [ENGLISH_2025];

export function getEnglishExamYears(): EnglishExamYear[] {
  return ENGLISH_EXAM_YEARS;
}

export function getEnglishVariant(variantId: string): EnglishExamVariant | null {
  for (const year of ENGLISH_EXAM_YEARS) {
    const match = year.variants.find((v) => v.id === variantId);
    if (match) return match;
  }
  return null;
}

/** The task's max points = number of items (each worth 1). */
export function englishTaskMaxPoints(task: EnglishTask): number {
  return task.items.length;
}
