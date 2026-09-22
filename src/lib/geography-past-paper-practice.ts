/**
 * The geography past papers, opened up for practice outside the exam simulator.
 *
 * `/subject/geography/mcq-practice` drills the 27 test questions and
 * `/subject/geography/open-practice` drills the criteria-based open sub-items
 * (the AI-graded ones). Both draw at random from the same archive the exam
 * simulator plays.
 */

import { getGeographyExamYears } from "@/data/geographyExamsData";
import {
  isGeographyMcqSubItem,
  type GeographyMcqQuestion,
  type GeographyOpenSubItem,
  type GeographyOpenTask,
} from "@/data/geographyExamsData";

export interface GeographyMcqDraw {
  question: GeographyMcqQuestion;
  year: number;
  variantLabel: string;
}

export interface GeographyOpenDraw {
  subItem: GeographyOpenSubItem;
  task: GeographyOpenTask;
  year: number;
  variantLabel: string;
}

/** Every test question the archive holds, flattened across years/variants. */
export function geographyMcqPool(): GeographyMcqDraw[] {
  const pool: GeographyMcqDraw[] = [];
  for (const year of getGeographyExamYears()) {
    for (const variant of year.variants) {
      for (const question of variant.mcq) {
        pool.push({ question, year: year.year, variantLabel: variant.label });
      }
    }
  }
  return pool;
}

/** Every AI-graded (criteria-based) open sub-item across the archive. */
export function geographyOpenPool(): GeographyOpenDraw[] {
  const pool: GeographyOpenDraw[] = [];
  for (const year of getGeographyExamYears()) {
    for (const variant of year.variants) {
      for (const task of variant.open) {
        for (const subItem of task.subItems) {
          if (!isGeographyMcqSubItem(subItem)) {
            pool.push({ subItem, task, year: year.year, variantLabel: variant.label });
          }
        }
      }
    }
  }
  return pool;
}

export function pickRandomGeographyMcq(excludeId?: string): GeographyMcqDraw | null {
  const all = geographyMcqPool();
  if (all.length === 0) return null;
  const pool = excludeId && all.length > 1 ? all.filter((d) => d.question.id !== excludeId) : all;
  return pool[Math.floor(Math.random() * pool.length)] ?? all[0];
}

export function pickRandomGeographyOpen(excludeId?: string): GeographyOpenDraw | null {
  const all = geographyOpenPool();
  if (all.length === 0) return null;
  const pool = excludeId && all.length > 1 ? all.filter((d) => d.subItem.id !== excludeId) : all;
  return pool[Math.floor(Math.random() * pool.length)] ?? all[0];
}

/** "2025 · I ვარიანტი" — the provenance line the practice pages show. */
export function geographyPaperLabel(item: { year: number; variantLabel: string }): string {
  return `${item.year} · ${item.variantLabel}`;
}
