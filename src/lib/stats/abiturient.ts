import type { ActivityEvent } from "@/lib/activity-log";
import {
  activityHeatmap,
  average,
  bestStreak,
  between,
  busiestWeekday,
  inSpace,
  rangeStart,
  startOfDay,
  type HeatCell,
  type StatsRange,
} from "./common";

export interface MockResult {
  id: string;
  subject: string;
  score: number;
  at: number;
}

export interface ReadinessStat {
  name: string;
  /** 0–100, from `subjectReadiness`. */
  readiness: number;
  mocks: number;
}

export const ESSAY_CRITERIA = [
  { key: "argumentation", label: "არგუმენტაცია" },
  { key: "structure", label: "სტრუქტურა" },
  { key: "style", label: "სტილი და გრამატიკა" },
] as const;

export type EssayCriterion = (typeof ESSAY_CRITERIA)[number]["key"];

export interface EssayStats {
  count: number;
  /** Out of 10. */
  average: number | null;
  /** Each criterion out of 10, null where no grade had it. */
  criteria: Record<EssayCriterion, number | null>;
}

export interface AbiturientStats {
  range: StatsRange;
  mockCount: number;
  lastMock: MockResult | null;
  averageScore: number | null;
  /** The average against the first simulation of the period, in points. */
  averageDelta: number | null;
  solvedTasks: number;
  /** Days to the exam, null when no plan sets a date. */
  examDaysLeft: number | null;
  readiness: ReadinessStat[];
  /** Every simulation, oldest first (the chart shows the last six, per subject if filtered). */
  allMocks: MockResult[];
  essay: EssayStats;
  heatmap: HeatCell[][];
  bestStreak: number;
  busiestWeekday: number | null;
}

/**
 * How ready a subject is, 0–100: the average simulation score, trusted in
 * full from the third simulation; before that it is scaled down (one good
 * run is not readiness), with a little credit for solved past tests.
 */
export function subjectReadiness(mockScores: number[], solvedTasks: number): number {
  const practice = Math.min(20, solvedTasks);
  if (mockScores.length === 0) return practice;
  const mean = mockScores.reduce((sum, score) => sum + score, 0) / mockScores.length;
  const trust = Math.min(1, mockScores.length / 3);
  return Math.round(Math.min(100, mean * trust + practice * (1 - trust)));
}

/** A grade to 0–10, whatever scale it came on (`max` in its meta, else 10). */
function outOfTen(value: unknown, max: unknown): number | null {
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  const scale = Number(max) > 0 ? Number(max) : 10;
  return Math.round((score / scale) * 100) / 10;
}

export function essayStats(events: ActivityEvent[]): EssayStats {
  const essays = events.filter((event) => event.type === "essay_graded");
  const criteria = {} as Record<EssayCriterion, number | null>;
  for (const { key } of ESSAY_CRITERIA) {
    const scores = essays
      .map((event) => {
        const criterion = (event.meta?.criteria as Record<string, unknown> | undefined)?.[key] as
          | { score?: number; max?: number }
          | undefined;
        return criterion ? outOfTen(criterion.score, criterion.max) : null;
      })
      .filter((score): score is number => score !== null);
    criteria[key] = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
  }
  const totals = essays
    .map((event) => outOfTen(event.value, event.meta?.max))
    .filter((score): score is number => score !== null);
  return {
    count: essays.length,
    average: totals.length ? Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 10) / 10 : null,
    criteria,
  };
}

/** Whole days from today to `examDate` (YYYY-MM-DD), never below 0. */
export function daysToExam(examDate: string | null, now: Date = new Date()): number | null {
  if (!examDate) return null;
  const [y, m, d] = examDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  return Math.max(0, Math.round((new Date(y, m - 1, d).getTime() - startOfDay(now)) / 86_400_000));
}

/**
 * The abiturient's numbers for a period, from the activity log: only the
 * abiturient space's events, readiness only for `subjectNames`.
 */
export function getAbiturientStats(
  log: ActivityEvent[],
  subjectNames: string[],
  range: StatsRange,
  examDate: string | null,
  now: Date = new Date(),
  heatmapWeeks = 12,
): AbiturientStats {
  const all = inSpace(log, "abiturient");
  const period = between(all, rangeStart(range, now));

  const toMock = (event: ActivityEvent): MockResult => ({
    id: event.id,
    subject: event.subject ?? "",
    score: event.value as number,
    at: event.createdAt,
  });
  const mocks = period.filter((event) => event.type === "mock_exam_completed" && event.value !== null).map(toMock);
  const allMocks = all.filter((event) => event.type === "mock_exam_completed" && event.value !== null).map(toMock);
  const averageScore = average(mocks.map((mock) => mock.score));

  const solved = (events: ActivityEvent[]) =>
    events
      .filter((event) => event.type === "past_test_solved")
      .reduce((sum, event) => sum + (Number(event.meta?.tasks) > 0 ? Number(event.meta?.tasks) : 1), 0);

  return {
    range,
    mockCount: mocks.length,
    lastMock: mocks.length ? mocks[mocks.length - 1] : null,
    averageScore,
    averageDelta: mocks.length >= 2 && averageScore !== null ? averageScore - mocks[0].score : null,
    solvedTasks: solved(period),
    examDaysLeft: daysToExam(examDate, now),
    readiness: subjectNames.map((name) => {
      const scores = allMocks.filter((mock) => mock.subject === name).map((mock) => mock.score);
      return {
        name,
        mocks: scores.length,
        readiness: subjectReadiness(scores, solved(all.filter((event) => event.subject === name))),
      };
    }),
    allMocks,
    essay: essayStats(period),
    heatmap: activityHeatmap(all, heatmapWeeks, now),
    bestStreak: bestStreak(all),
    busiestWeekday: busiestWeekday(all),
  };
}

/** The essay rubric's ten criteria, folded into the three the stats page shows. */
const ESSAY_GROUPS: Record<EssayCriterion, string[]> = {
  argumentation: ["I", "IV", "VI"],
  structure: ["II"],
  style: ["VIII", "IX", "X"],
};

/**
 * One essay grade as an `essay_graded` event's value and meta: the total out
 * of `totalMax`, and each of the three groups as score / max.
 */
export function essayGradeEvent(
  totalScore: number,
  totalMax: number,
  criteria: { id: string; score: number }[],
  maxes: Record<string, number>,
): { value: number; meta: Record<string, unknown> } {
  const grouped: Record<string, { score: number; max: number }> = {};
  for (const [key, ids] of Object.entries(ESSAY_GROUPS)) {
    const score = criteria.filter((c) => ids.includes(c.id)).reduce((sum, c) => sum + c.score, 0);
    const max = ids.reduce((sum, id) => sum + (maxes[id] ?? 0), 0);
    if (max > 0) grouped[key] = { score, max };
  }
  return { value: totalScore, meta: { max: totalMax, criteria: grouped } };
}
