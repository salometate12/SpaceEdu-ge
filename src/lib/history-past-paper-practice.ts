/**
 * The history past papers, opened up for practice outside the exam simulator.
 *
 * `/subject/history/reading-comprehension` drills the test questions and
 * `/subject/history/essay-practice` drills the source-based open sub-items
 * (37.x, 38.x). Both draw at random from the real 2025 archive
 * (`historyExamsData.ts`) — every variant pooled together.
 */

import { getHistoryExamYears } from "@/data/historyExamsData";
import type {
  HistoryMcqQuestion,
  HistoryOpenSubItem,
  HistoryOpenTask,
  HistorySourceDocument,
} from "@/data/historyExamsData";

export interface HistoryMcqDraw {
  question: HistoryMcqQuestion;
  year: number;
  variantLabel: string;
  /** Present only when the question is tied to a source document. */
  sourceDocument?: HistorySourceDocument;
}

export interface HistoryOpenDraw {
  subItem: HistoryOpenSubItem;
  task: HistoryOpenTask;
  year: number;
  variantLabel: string;
}

/** Every test question the archive holds, flattened across all years/variants. */
export function historyMcqPool(): HistoryMcqDraw[] {
  const pool: HistoryMcqDraw[] = [];
  for (const year of getHistoryExamYears()) {
    for (const variant of year.variants) {
      for (const question of variant.mcq) {
        pool.push({ question, year: year.year, variantLabel: variant.label });
      }
    }
  }
  return pool;
}

/** Every open sub-item (37.x / 38.x) the archive holds, with its task. */
export function historyOpenSubItemPool(): HistoryOpenDraw[] {
  const pool: HistoryOpenDraw[] = [];
  for (const year of getHistoryExamYears()) {
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

/** One test question at random, never the one already on screen. */
export function pickRandomHistoryMcq(excludeId?: string): HistoryMcqDraw | null {
  const all = historyMcqPool();
  if (all.length === 0) return null;
  const pool =
    excludeId && all.length > 1 ? all.filter((d) => d.question.id !== excludeId) : all;
  return pool[Math.floor(Math.random() * pool.length)] ?? all[0];
}

/** One open sub-item at random, never the one already on screen. */
export function pickRandomHistoryOpenSubItem(excludeId?: string): HistoryOpenDraw | null {
  const all = historyOpenSubItemPool();
  if (all.length === 0) return null;
  const pool =
    excludeId && all.length > 1 ? all.filter((d) => d.subItem.id !== excludeId) : all;
  return pool[Math.floor(Math.random() * pool.length)] ?? all[0];
}

/** "2025 · I ვარიანტი" — the provenance line the practice pages show. */
export function historyPaperLabel(item: { year: number; variantLabel: string }): string {
  return `${item.year} · ${item.variantLabel}`;
}
