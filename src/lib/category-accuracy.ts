/**
 * Per-category accuracy tracking that powers the Weakness Radar.
 *
 * Every graded answer in the past-exam archive and the reading modules
 * calls `recordCategoryAttempt`, so the radar reflects real practice
 * rather than a static mock.
 */

import {
  EXAM_CATEGORY_IDS,
  EXAM_CATEGORY_META,
  type ExamCategory,
} from "@/lib/exam-categories";

const STORAGE_KEY = "spaceedu-category-accuracy";

export const CATEGORY_ACCURACY_UPDATED_EVENT = "spaceedu-category-accuracy-updated";

/** Below this, a category counts as a weak point worth drilling. */
export const WEAK_THRESHOLD = 70;

/** A category needs this many attempts before the radar trusts its rate. */
export const MIN_ATTEMPTS_FOR_SIGNAL = 3;

type Tally = { correct: number; total: number };
type Store = Partial<Record<ExamCategory, Tally>>;

export interface CategoryStat {
  category: ExamCategory;
  label: string;
  accent: string;
  hint: string;
  correct: number;
  total: number;
  /** 0-100, rounded. `null` when the category has no attempts yet. */
  accuracy: number | null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isExamCategory(value: string): value is ExamCategory {
  return (EXAM_CATEGORY_IDS as readonly string[]).includes(value);
}

function readStore(): Store {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const store: Store = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!isExamCategory(key) || !value || typeof value !== "object") continue;
      const tally = value as Partial<Tally>;
      if (typeof tally.correct !== "number" || typeof tally.total !== "number") continue;
      store[key] = {
        correct: Math.max(0, tally.correct),
        total: Math.max(0, tally.total),
      };
    }
    return store;
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event(CATEGORY_ACCURACY_UPDATED_EVENT));
  } catch {
    /* storage unavailable — analytics are best-effort */
  }
}

export function recordCategoryAttempt(category: ExamCategory, correct: boolean): void {
  const store = readStore();
  const current = store[category] ?? { correct: 0, total: 0 };
  store[category] = {
    correct: current.correct + (correct ? 1 : 0),
    total: current.total + 1,
  };
  writeStore(store);
}

/** Every category, richest data first; untouched ones sort last. */
export function getCategoryStats(): CategoryStat[] {
  const store = readStore();
  return EXAM_CATEGORY_IDS.map((category) => {
    const tally = store[category];
    const meta = EXAM_CATEGORY_META[category];
    const total = tally?.total ?? 0;
    return {
      category,
      label: meta.label,
      accent: meta.accent,
      hint: meta.hint,
      correct: tally?.correct ?? 0,
      total,
      accuracy: total > 0 ? Math.round(((tally?.correct ?? 0) / total) * 100) : null,
    };
  }).sort((a, b) => {
    if (a.total === 0 && b.total === 0) return 0;
    if (a.total === 0) return 1;
    if (b.total === 0) return -1;
    return (a.accuracy ?? 0) - (b.accuracy ?? 0);
  });
}

/**
 * The category most worth practising: lowest accuracy among those with
 * enough attempts to be meaningful. Returns null while the student has
 * not practised enough for the signal to mean anything.
 */
export function weakestCategory(stats?: CategoryStat[]): CategoryStat | null {
  const list = stats ?? getCategoryStats();
  const candidates = list.filter(
    (stat) =>
      stat.total >= MIN_ATTEMPTS_FOR_SIGNAL &&
      stat.accuracy !== null &&
      stat.accuracy < WEAK_THRESHOLD,
  );
  return candidates[0] ?? null;
}

export function totalAttempts(stats?: CategoryStat[]): number {
  return (stats ?? getCategoryStats()).reduce((sum, stat) => sum + stat.total, 0);
}

export function overallAccuracy(stats?: CategoryStat[]): number | null {
  const list = stats ?? getCategoryStats();
  const total = list.reduce((sum, stat) => sum + stat.total, 0);
  if (total === 0) return null;
  const correct = list.reduce((sum, stat) => sum + stat.correct, 0);
  return Math.round((correct / total) * 100);
}
