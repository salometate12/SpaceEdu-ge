/**
 * National Exams Interactive Archive — structured question bank.
 *
 * The archive is deliberately data-only so new years can be added by
 * dropping another `ExamYear` into `PAST_EXAMS`; no component changes are
 * needed. Nothing here renders an external PDF — every variant is played
 * inside SpaceEdu's native split-screen quiz interface.
 *
 * Content note: the Georgian archive (2022–2025) carries the exercises of
 * the real NAEC papers — see each year's file for its rights note and for
 * the fact that the answer keys are SpaceEdu's own worked solutions, since
 * the published booklets ship no key. The history seed below is still an
 * ORIGINAL practice text written in the style of the exams (the same
 * convention used by `readingComprehensionData.ts`).
 *
 * Typography: Georgian inline quotes use the typographic pair „…“.
 */

import type { ExamCategory } from "@/lib/exam-categories";
import { GEORGIAN_2025 } from "./pastExams2025";
import { GEORGIAN_2024 } from "./pastExams2024";
import { GEORGIAN_2023 } from "./pastExams2023";
import { GEORGIAN_2022 } from "./pastExams2022";

export interface ExamQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  /** Shown in the feedback card after "პასუხის შემოწმება". */
  explanation: string;
  category: ExamCategory;
  /**
   * Exact phrase from `ExamPassage.textExcerpt`. When this question is
   * active — or hovered in the question rail — the trope highlighter
   * illuminates the span in the left reading panel.
   */
  highlightPhrase?: string;
}

/** Part II's writing task — the essay prompt attached to a passage. */
export interface ExamEssayTask {
  id: string;
  points: number;
  prompt: string;
}

/** Part I — "ტექსტის რედაქტირება". A free-writing exercise, not an MCQ. */
export interface ExamEditingTask {
  id: string;
  points: number;
  /** The flawed text the student has to rewrite correctly. */
  text: string;
  /** What the marker is looking for, shown after the student submits. */
  focusPoints: string[];
}

export interface ExamPassage {
  id: string;
  title: string;
  authorOrSource: string;
  textExcerpt: string;
  /** Poems keep their line breaks in the reading panel. */
  kind?: "poem" | "prose";
  questions: ExamQuestion[];
  /** Part II's writing task for this text. */
  essay?: ExamEssayTask;
  /** Shown on the text-choice screen ("ტექსტი I" / "ტექსტი II"). */
  choiceLabel?: string;
}

export interface ExamVariant {
  id: string;
  /** "I ვარიანტი" / "II ვარიანტი" */
  label: string;
  /** Short descriptor shown under the badge. */
  blurb: string;
  /** Part I of the paper, when the variant has one. */
  editingTask?: ExamEditingTask;
  /**
   * True for real national-exam papers, where Part II offers two texts and
   * the student answers on ONE of them. When false/absent the passages run
   * back to back as a single question set.
   */
  choosePassage?: boolean;
  passages: ExamPassage[];
}

export interface ExamYear {
  year: number;
  variants: ExamVariant[];
}

/* -------------------------------------------------------------------------- */
/*                                  REGISTRY                                  */
/* -------------------------------------------------------------------------- */

/**
 * History is no longer served from here: it has its own real 2025 archive in
 * `historyExamsData.ts` (source-based MCQ + open tasks, graded at the end),
 * rendered by `HistoryPastExamsArchive`. The old `HISTORY_2024` entry here was
 * an ORIGINAL practice text, not a real paper, and was removed to avoid
 * confusing it with the genuine exam.
 */
export const PAST_EXAMS: Record<string, ExamYear[]> = {
  georgian: [GEORGIAN_2025, GEORGIAN_2024, GEORGIAN_2023, GEORGIAN_2022],
};

export function getExamYears(subjectId: string): ExamYear[] {
  return PAST_EXAMS[subjectId] ?? [];
}

export function hasPastExams(subjectId: string): boolean {
  return getExamYears(subjectId).length > 0;
}

export function getExamVariant(
  subjectId: string,
  year: number,
  variantId: string,
): ExamVariant | null {
  const match = getExamYears(subjectId).find((entry) => entry.year === year);
  return match?.variants.find((variant) => variant.id === variantId) ?? null;
}

/** Flattens a variant into a single ordered question run, keeping the
 * owning passage alongside each question so the reading panel can follow. */
export interface ExamRunStep {
  passage: ExamPassage;
  question: ExamQuestion;
}

export function buildExamRun(variant: ExamVariant): ExamRunStep[] {
  return variant.passages.flatMap((passage) =>
    passage.questions.map((question) => ({ passage, question })),
  );
}

export function countVariantQuestions(variant: ExamVariant): number {
  return variant.passages.reduce((sum, passage) => sum + passage.questions.length, 0);
}
