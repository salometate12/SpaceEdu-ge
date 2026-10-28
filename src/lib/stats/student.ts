import type { ActivityEvent } from "@/lib/activity-log";
import {
  activeDayCount,
  activityHeatmap,
  average,
  bestStreak,
  between,
  busiestWeekday,
  inSpace,
  previousRangeStart,
  rangeDays,
  rangeStart,
  toolCounts,
  type HeatCell,
  type StatsRange,
  type ToolCount,
} from "./common";

export interface SubjectStat {
  name: string;
  /** 0–100, from `subjectProgress`. */
  progress: number;
  planDays: number;
  quizzes: number;
  quizAverage: number | null;
}

export interface StudentStats {
  range: StatsRange;
  periodDays: number;
  activeDays: number;
  quizzes: number;
  quizAverage: number | null;
  aiSessions: number;
  aiSessionsPrevious: number;
  /** Hours from the study-plan days marked done. */
  studyHours: number;
  heatmap: HeatCell[][];
  bestStreak: number;
  busiestWeekday: number | null;
  subjects: SubjectStat[];
  tools: ToolCount[];
}

/**
 * A subject's progress, 0–100: up to 60 for study-plan days done (10 each)
 * and up to 40 for quizzes — the average score, counted in full from the
 * third quiz on. One formula for the stats page and anything else that
 * shows a subject bar.
 */
export function subjectProgress(planDays: number, quizzes: number, quizAverage: number | null): number {
  const plan = Math.min(60, planDays * 10);
  const quiz = quizAverage === null ? 0 : (quizAverage / 100) * 40 * Math.min(1, quizzes / 3);
  return Math.round(Math.min(100, plan + quiz));
}

/** A conversation counts once; with no session events yet, each message day does. */
function aiSessionCount(events: ActivityEvent[]): number {
  return events.filter((event) => event.type === "ai_session").length;
}

/**
 * The student's numbers for a period, from the activity log: only the
 * student space's events, and only the student's own subjects.
 */
export function getStudentStats(
  log: ActivityEvent[],
  subjectNames: string[],
  range: StatsRange,
  now: Date = new Date(),
  heatmapWeeks = 12,
): StudentStats {
  const all = inSpace(log, "student");
  const from = rangeStart(range, now);
  const period = between(all, from);
  const previous = between(all, previousRangeStart(range, now), from);

  const quizzes = period.filter((event) => event.type === "quiz_completed");
  const planDays = period.filter((event) => event.type === "plan_day_done");
  const studyHours = planDays.reduce((sum, event) => {
    const hours = Number(event.meta?.hours);
    return sum + (Number.isFinite(hours) && hours > 0 ? hours : 0);
  }, 0);

  const subjects = subjectNames.map((name): SubjectStat => {
    const ofSubject = all.filter((event) => event.subject === name);
    const subjectQuizzes = ofSubject.filter((event) => event.type === "quiz_completed" && event.value !== null);
    const done = ofSubject.filter((event) => event.type === "plan_day_done").length;
    const quizAverage = average(subjectQuizzes.map((event) => event.value as number));
    return {
      name,
      planDays: done,
      quizzes: subjectQuizzes.length,
      quizAverage,
      progress: subjectProgress(done, subjectQuizzes.length, quizAverage),
    };
  });

  return {
    range,
    periodDays: rangeDays(range, now),
    activeDays: activeDayCount(period),
    quizzes: quizzes.length,
    quizAverage: average(quizzes.filter((event) => event.value !== null).map((event) => event.value as number)),
    aiSessions: aiSessionCount(period),
    aiSessionsPrevious: aiSessionCount(previous),
    studyHours: Math.round(studyHours * 10) / 10,
    heatmap: activityHeatmap(all, heatmapWeeks, now),
    bestStreak: bestStreak(all),
    busiestWeekday: busiestWeekday(all),
    subjects,
    tools: toolCounts(period),
  };
}
