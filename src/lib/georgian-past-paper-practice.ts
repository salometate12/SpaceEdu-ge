/**
 * The past papers, opened up for practice outside the exam simulator.
 *
 * `/subject/georgian/text-editing` drills Part I — "ტექსტის რედაქტირება" —
 * and `/subject/georgian/reading-comprehension` drills Part II's texts.
 * Both used to run on invented material; both now draw at random from the
 * same archive the exam simulator plays, so what a student practises is
 * what was actually set.
 */

import { getExamYears } from "@/data/pastExamsData";
import type {
  Passage,
  PassageCategory,
  Question,
  QuestionType,
} from "@/data/readingComprehensionData";
import type { ExamCategory } from "@/lib/exam-categories";

/* -------------------------------------------------------------------------- */
/*                        PART I — ტექსტის რედაქტირება                        */
/* -------------------------------------------------------------------------- */

export interface PastEditingTask {
  id: string;
  year: number;
  /** "I ვარიანტი", "დამატებითი სესია", … */
  variantLabel: string;
  /** What the task was worth on the paper. */
  points: number;
  /** The flawed text, exactly as the paper set it. */
  text: string;
  /** What the marker was looking for. */
  focusPoints: string[];
}

/** Every Part I task the archive holds, newest year first. */
export function pastEditingTasks(subjectId = "georgian"): PastEditingTask[] {
  const tasks: PastEditingTask[] = [];
  for (const year of getExamYears(subjectId)) {
    for (const variant of year.variants) {
      if (!variant.editingTask) continue;
      tasks.push({
        id: `${year.year}-${variant.id}-${variant.editingTask.id}`,
        year: year.year,
        variantLabel: variant.label,
        points: variant.editingTask.points,
        text: variant.editingTask.text,
        focusPoints: variant.editingTask.focusPoints,
      });
    }
  }
  return tasks;
}

/** One task at random, never the one already on screen. */
export function pickRandomEditingTask(
  excludeId?: string,
  subjectId = "georgian",
): PastEditingTask | null {
  const all = pastEditingTasks(subjectId);
  if (all.length === 0) return null;
  const pool =
    excludeId && all.length > 1 ? all.filter((task) => task.id !== excludeId) : all;
  return pool[Math.floor(Math.random() * pool.length)] ?? all[0];
}

/* -------------------------------------------------------------------------- */
/*                     PART II — წაკითხულის გააზრება                          */
/* -------------------------------------------------------------------------- */

/**
 * The reading module knows three question types; the archive tags nine
 * categories, six of which are the literary devices. Everything that names
 * a device is a `literary_trope` question here.
 */
function toQuestionType(category: ExamCategory): QuestionType {
  if (category === "main_idea") return "main_idea";
  if (category === "implied_meaning" || category === "grammar") {
    return "implied_meaning";
  }
  return "literary_trope";
}

/**
 * Part II of the Georgian paper sets literature — poems, novels, stories,
 * hagiography — so every text in the archive is a მხატვრული one. The
 * reading module's other category exists for its own informational
 * passages and stays unused here.
 */
const PAST_PAPER_CATEGORY: PassageCategory = "მხატვრული";

export interface PastPassage extends Passage {
  year: number;
  variantLabel: string;
  /** Poems keep their line breaks in the reading panel. */
  kind?: "poem" | "prose";
}

/** Every Part II text the archive holds, with its questions. */
export function pastPassages(subjectId = "georgian"): PastPassage[] {
  const passages: PastPassage[] = [];
  for (const year of getExamYears(subjectId)) {
    for (const variant of year.variants) {
      for (const passage of variant.passages) {
        if (passage.questions.length === 0) continue;
        const questions: Question[] = passage.questions.map((question) => ({
          id: `${year.year}-${variant.id}-${question.id}`,
          questionText: question.questionText,
          options: question.options,
          correctIndex: question.correctIndex,
          explanation: question.explanation,
          type: toQuestionType(question.category),
          highlightPhrase: question.highlightPhrase,
        }));
        passages.push({
          id: `${year.year}-${variant.id}-${passage.id}`,
          title: passage.title,
          authorOrSource: passage.authorOrSource,
          category: PAST_PAPER_CATEGORY,
          textExcerpt: passage.textExcerpt,
          questions,
          year: year.year,
          variantLabel: variant.label,
          kind: passage.kind,
        });
      }
    }
  }
  return passages;
}

/** One text at random, never the one already on screen. */
export function pickRandomPastPassage(
  excludeId?: string,
  subjectId = "georgian",
): PastPassage | null {
  const all = pastPassages(subjectId);
  if (all.length === 0) return null;
  const pool =
    excludeId && all.length > 1 ? all.filter((p) => p.id !== excludeId) : all;
  return pool[Math.floor(Math.random() * pool.length)] ?? all[0];
}

/** "2025 · I ვარიანტი" — the provenance line both pages show. */
export function paperLabel(item: { year: number; variantLabel: string }): string {
  return `${item.year} · ${item.variantLabel}`;
}

/** How many questions the archive's Part II texts carry in total. */
export function pastQuestionCount(subjectId = "georgian"): number {
  return pastPassages(subjectId).reduce(
    (total, passage) => total + passage.questions.length,
    0,
  );
}

/**
 * What the papers actually ask, counted — so the practice page can say
 * "these are the questions" rather than advertising a list of tropes.
 */
export function pastCategoryCounts(
  subjectId = "georgian",
): { category: ExamCategory; count: number }[] {
  const counts = new Map<ExamCategory, number>();
  for (const year of getExamYears(subjectId)) {
    for (const variant of year.variants) {
      for (const passage of variant.passages) {
        for (const question of passage.questions) {
          counts.set(question.category, (counts.get(question.category) ?? 0) + 1);
        }
      }
    }
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}
