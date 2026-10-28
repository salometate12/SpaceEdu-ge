import type { ActivityEvent, StatsSpace, ToolKey } from "@/lib/activity-log";

/** The periods the stats pages offer: the last 7 / 30 days, the semester (student) or the exam season (abiturient). */
export type StatsRange = "7d" | "30d" | "semester" | "until_exam";

export const RANGE_LABEL: Record<StatsRange, string> = {
  "7d": "7 დღე",
  "30d": "30 დღე",
  semester: "სემესტრი",
  until_exam: "სეზონი",
};

const DAY_MS = 86_400_000;

/** YYYY-MM-DD in local time. */
export function dayKey(at: number | Date): string {
  const date = new Date(at);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function startOfDay(at: number | Date): number {
  return new Date(at).setHours(0, 0, 0, 0);
}

/**
 * Where a period starts. The semester runs from 1 September or 1 February,
 * whichever came last; the exam season from 1 September (the school year's
 * start, when preparation begins).
 */
export function rangeStart(range: StatsRange, now: Date = new Date()): number {
  const today = startOfDay(now);
  if (range === "7d") return today - 6 * DAY_MS;
  if (range === "30d") return today - 29 * DAY_MS;
  const year = now.getFullYear();
  const month = now.getMonth();
  if (range === "semester") {
    if (month >= 8) return new Date(year, 8, 1).getTime();
    if (month === 0) return new Date(year - 1, 8, 1).getTime();
    return new Date(year, 1, 1).getTime();
  }
  return new Date(month >= 8 ? year : year - 1, 8, 1).getTime();
}

/** Days in the period up to today, today included. */
export function rangeDays(range: StatsRange, now: Date = new Date()): number {
  return Math.round((startOfDay(now) - rangeStart(range, now)) / DAY_MS) + 1;
}

/** The same length of time just before the period. */
export function previousRangeStart(range: StatsRange, now: Date = new Date()): number {
  return rangeStart(range, now) - rangeDays(range, now) * DAY_MS;
}

export function inSpace(events: ActivityEvent[], space: StatsSpace): ActivityEvent[] {
  return events.filter((event) => event.space === space);
}

export function between(events: ActivityEvent[], from: number, to: number = Number.POSITIVE_INFINITY): ActivityEvent[] {
  return events.filter((event) => event.createdAt >= from && event.createdAt < to);
}

export function activeDayCount(events: ActivityEvent[]): number {
  return new Set(events.map((event) => dayKey(event.createdAt))).size;
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

/** The longest run of consecutive active days. */
export function bestStreak(events: ActivityEvent[]): number {
  const days = [...new Set(events.map((event) => startOfDay(event.createdAt)))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let previous: number | null = null;
  for (const day of days) {
    run = previous !== null && Math.round((day - previous) / DAY_MS) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

export const WEEKDAY_LONG = ["ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი", "კვირა"];

/** The weekday (Monday = 0) with the most activity, or null with none. */
export function busiestWeekday(events: ActivityEvent[]): number | null {
  if (events.length === 0) return null;
  const counts = new Array(7).fill(0);
  for (const event of events) counts[(new Date(event.createdAt).getDay() + 6) % 7] += 1;
  return counts.indexOf(Math.max(...counts));
}

export interface HeatCell {
  date: string;
  count: number;
  /** 0 (none) … 4 (most). */
  level: number;
  future: boolean;
}

/** How busy a day was, on five steps. */
export function heatLevel(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

/**
 * The activity map: `weeks` columns of Monday…Sunday, the last one holding
 * today. Days after today are marked `future` and stay empty.
 */
export function activityHeatmap(events: ActivityEvent[], weeks: number, now: Date = new Date()): HeatCell[][] {
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = dayKey(event.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const today = startOfDay(now);
  const monday = new Date(today);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - (weeks - 1) * 7);
  const columns: HeatCell[][] = [];
  for (let w = 0; w < weeks; w += 1) {
    const column: HeatCell[] = [];
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + w * 7 + d);
      const key = dayKey(date);
      const count = counts.get(key) ?? 0;
      column.push({ date: key, count, level: heatLevel(count), future: date.getTime() > today });
    }
    columns.push(column);
  }
  return columns;
}

export interface ToolCount {
  tool: ToolKey;
  count: number;
}

/** Tool opens and sessions per tool, most used first. */
export function toolCounts(events: ActivityEvent[]): ToolCount[] {
  const counts = new Map<ToolKey, number>();
  for (const event of events) {
    if (!event.tool || event.tool === "other") continue;
    if (event.type !== "tool_open" && event.type !== "ai_session") continue;
    counts.set(event.tool, (counts.get(event.tool) ?? 0) + 1);
  }
  return [...counts.entries()].map(([tool, count]) => ({ tool, count })).sort((a, b) => b.count - a.count);
}
