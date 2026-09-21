/**
 * The maths past papers, opened up for practice outside the exam simulator.
 *
 * `/subject/math/mcq-practice` drills the 37 test questions and
 * `/subject/math/open-practice` drills the open problems (38–41). Both draw at
 * random from the same archive the exam simulator plays — every year and every
 * variant pooled together — so a student practises what was actually set.
 */

import { getMathExamYears } from "@/data/mathExamsData";
import type { MathMcqQuestion, MathOpenProblem } from "@/data/mathExamsData";

export interface MathMcqDraw {
  question: MathMcqQuestion;
  year: number;
  variantLabel: string;
}

export interface MathOpenDraw {
  problem: MathOpenProblem;
  year: number;
  variantLabel: string;
}

/** Every test question the archive holds, flattened across all years/variants. */
export function mathMcqPool(): MathMcqDraw[] {
  const pool: MathMcqDraw[] = [];
  for (const year of getMathExamYears()) {
    for (const variant of year.variants) {
      for (const question of variant.mcq) {
        pool.push({ question, year: year.year, variantLabel: variant.label });
      }
    }
  }
  return pool;
}

/** Every open problem the archive holds, flattened across all years/variants. */
export function mathOpenPool(): MathOpenDraw[] {
  const pool: MathOpenDraw[] = [];
  for (const year of getMathExamYears()) {
    for (const variant of year.variants) {
      for (const problem of variant.open) {
        pool.push({ problem, year: year.year, variantLabel: variant.label });
      }
    }
  }
  return pool;
}

/** One test question at random, never the one already on screen. */
export function pickRandomMathMcq(excludeId?: string): MathMcqDraw | null {
  const all = mathMcqPool();
  if (all.length === 0) return null;
  const pool =
    excludeId && all.length > 1 ? all.filter((d) => d.question.id !== excludeId) : all;
  return pool[Math.floor(Math.random() * pool.length)] ?? all[0];
}

/** One open problem at random, never the one already on screen. */
export function pickRandomMathOpenProblem(excludeId?: string): MathOpenDraw | null {
  const all = mathOpenPool();
  if (all.length === 0) return null;
  const pool =
    excludeId && all.length > 1 ? all.filter((d) => d.problem.id !== excludeId) : all;
  return pool[Math.floor(Math.random() * pool.length)] ?? all[0];
}

/** "2025 · I ვარიანტი" — the provenance line the practice pages show. */
export function mathPaperLabel(item: { year: number; variantLabel: string }): string {
  return `${item.year} · ${item.variantLabel}`;
}
