/**
 * The civics past papers, opened up for practice outside the exam simulator.
 * `/subject/civics/mcq-practice` drills the 24 test questions and
 * `/subject/civics/open-practice` drills the AI-graded open sub-items.
 */

import { getCivicsExamYears } from "@/data/civicsExamsData";
import type {
  CivicsMcqQuestion,
  CivicsOpenSubItem,
  CivicsOpenTask,
} from "@/data/civicsExamsData";

export interface CivicsMcqDraw {
  question: CivicsMcqQuestion;
  year: number;
  variantLabel: string;
}

export interface CivicsOpenDraw {
  subItem: CivicsOpenSubItem;
  task: CivicsOpenTask;
  year: number;
  variantLabel: string;
}

export function civicsMcqPool(): CivicsMcqDraw[] {
  const pool: CivicsMcqDraw[] = [];
  for (const year of getCivicsExamYears()) {
    for (const variant of year.variants) {
      for (const question of variant.mcq) {
        pool.push({ question, year: year.year, variantLabel: variant.label });
      }
    }
  }
  return pool;
}

/** Only the AI-graded open sub-items (skip matching and MCQ sub-items). */
export function civicsOpenPool(): CivicsOpenDraw[] {
  const pool: CivicsOpenDraw[] = [];
  for (const year of getCivicsExamYears()) {
    for (const variant of year.variants) {
      for (const task of variant.open) {
        for (const subItem of task.subItems) {
          if (subItem.criteria && !subItem.options && !subItem.matching) {
            pool.push({ subItem, task, year: year.year, variantLabel: variant.label });
          }
        }
      }
    }
  }
  return pool;
}

export function pickRandomCivicsMcq(excludeId?: string): CivicsMcqDraw | null {
  const all = civicsMcqPool();
  if (all.length === 0) return null;
  const pool = excludeId && all.length > 1 ? all.filter((d) => d.question.id !== excludeId) : all;
  return pool[Math.floor(Math.random() * pool.length)] ?? all[0];
}

export function pickRandomCivicsOpen(excludeId?: string): CivicsOpenDraw | null {
  const all = civicsOpenPool();
  if (all.length === 0) return null;
  const pool = excludeId && all.length > 1 ? all.filter((d) => d.subItem.id !== excludeId) : all;
  return pool[Math.floor(Math.random() * pool.length)] ?? all[0];
}

export function civicsPaperLabel(item: { year: number; variantLabel: string }): string {
  return `${item.year} · ${item.variantLabel}`;
}
