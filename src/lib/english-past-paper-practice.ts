/**
 * The English past papers, opened up for practice outside the exam simulator.
 *
 * `/subject/english/task-practice` drills the answer-key tasks (listening,
 * reading, vocabulary, grammar, dialogue) and `/subject/english/writing-practice`
 * drills the Task 7 essay with AI grading. Both draw at random from the same
 * archive the exam simulator plays — every year and every variant pooled
 * together — so a student practises what was actually set.
 */

import { getEnglishEssayPrompts, getEnglishExamYears } from "@/data/englishExamsData";
import type { EnglishTask, EnglishEssayTask } from "@/data/englishExamsData";

export interface EnglishTaskDraw {
  task: EnglishTask;
  year: number;
  variantLabel: string;
}

export interface EnglishEssayDraw {
  essay: EnglishEssayTask;
  year: number;
  variantLabel: string;
}

/** Every answer-key task the archive holds, flattened across years/variants. */
export function englishTaskPool(): EnglishTaskDraw[] {
  const pool: EnglishTaskDraw[] = [];
  for (const year of getEnglishExamYears()) {
    for (const variant of year.variants) {
      for (const task of variant.tasks) {
        pool.push({ task, year: year.year, variantLabel: variant.label });
      }
    }
  }
  return pool;
}

/** Every real Task 7 essay prompt (all four 2025 variants), for the writing
 *  practice's random draw. Not limited to the fully-transcribed exam variants,
 *  since every variant's essay prompt is verbatim from its booklet. */
export function englishEssayPool(): EnglishEssayDraw[] {
  return getEnglishEssayPrompts().map((p) => ({
    essay: p.essay,
    year: p.year,
    variantLabel: p.variantLabel,
  }));
}

/** One task at random, never the one already on screen. */
export function pickRandomEnglishTask(excludeId?: string): EnglishTaskDraw | null {
  const all = englishTaskPool();
  if (all.length === 0) return null;
  const pool = excludeId && all.length > 1 ? all.filter((d) => d.task.id !== excludeId) : all;
  return pool[Math.floor(Math.random() * pool.length)] ?? all[0];
}

/** One essay prompt at random, never the one already on screen. */
export function pickRandomEnglishEssay(excludeId?: string): EnglishEssayDraw | null {
  const all = englishEssayPool();
  if (all.length === 0) return null;
  const pool = excludeId && all.length > 1 ? all.filter((d) => d.essay.id !== excludeId) : all;
  return pool[Math.floor(Math.random() * pool.length)] ?? all[0];
}

/** "2025 · I ვარიანტი" — the provenance line the practice pages show. */
export function englishPaperLabel(item: { year: number; variantLabel: string }): string {
  return `${item.year} · ${item.variantLabel}`;
}
