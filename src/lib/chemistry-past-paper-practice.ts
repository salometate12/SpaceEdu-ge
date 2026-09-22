/**
 * The chemistry past papers, opened up for practice outside the exam simulator.
 * `/subject/chemistry/mcq-practice` drills the 30 test questions and
 * `/subject/chemistry/open-practice` drills the open sub-items (all AI-graded).
 */

import { getChemistryExamYears } from "@/data/chemistryExamsData";
import type {
  ChemistryMcqQuestion,
  ChemistryOpenSubItem,
  ChemistryOpenTask,
} from "@/data/chemistryExamsData";

export interface ChemistryMcqDraw {
  question: ChemistryMcqQuestion;
  year: number;
  variantLabel: string;
}

export interface ChemistryOpenDraw {
  subItem: ChemistryOpenSubItem;
  task: ChemistryOpenTask;
  year: number;
  variantLabel: string;
}

export function chemistryMcqPool(): ChemistryMcqDraw[] {
  const pool: ChemistryMcqDraw[] = [];
  for (const year of getChemistryExamYears()) {
    for (const variant of year.variants) {
      for (const question of variant.mcq) {
        pool.push({ question, year: year.year, variantLabel: variant.label });
      }
    }
  }
  return pool;
}

export function chemistryOpenPool(): ChemistryOpenDraw[] {
  const pool: ChemistryOpenDraw[] = [];
  for (const year of getChemistryExamYears()) {
    for (const variant of year.variants) {
      for (const task of variant.open) {
        for (const subItem of task.subItems) {
          pool.push({ subItem, task, year: year.year, variantLabel: variant.label });
        }
      }
    }
  }
  return pool;
}

export function pickRandomChemistryMcq(excludeId?: string): ChemistryMcqDraw | null {
  const all = chemistryMcqPool();
  if (all.length === 0) return null;
  const pool = excludeId && all.length > 1 ? all.filter((d) => d.question.id !== excludeId) : all;
  return pool[Math.floor(Math.random() * pool.length)] ?? all[0];
}

export function pickRandomChemistryOpen(excludeId?: string): ChemistryOpenDraw | null {
  const all = chemistryOpenPool();
  if (all.length === 0) return null;
  const pool = excludeId && all.length > 1 ? all.filter((d) => d.subItem.id !== excludeId) : all;
  return pool[Math.floor(Math.random() * pool.length)] ?? all[0];
}

export function chemistryPaperLabel(item: { year: number; variantLabel: string }): string {
  return `${item.year} · ${item.variantLabel}`;
}
