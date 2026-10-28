import type { ToolUsageEvent } from "./activity";
import { MONTH_LONG } from "./study-day";

export interface DiaryEntry {
  key: string;
  toolId: string;
  title: string;
  subject: string | null;
  /** The latest of the merged opens. */
  at: number;
  /** How many opens were merged into this line. */
  count: number;
}

export interface DiaryDay {
  /** „დღეს“, „გუშინ“ or „24 ოქტომბერი“. */
  label: string;
  entries: DiaryEntry[];
}

function dayStart(at: number): number {
  return new Date(at).setHours(0, 0, 0, 0);
}

export function diaryDayLabel(at: number, now: Date = new Date()): string {
  const days = Math.round((dayStart(now.getTime()) - dayStart(at)) / 86_400_000);
  if (days <= 0) return "დღეს";
  if (days === 1) return "გუშინ";
  const date = new Date(at);
  return `${date.getDate()} ${MONTH_LONG[date.getMonth()]}`;
}

/**
 * The diary: the latest tool opens grouped by day, newest first, with the
 * same tool on the same subject on one day shown once (opened three times
 * → one line). At most `limit` lines in all.
 */
export function buildDiary(events: ToolUsageEvent[], limit = 8, now: Date = new Date()): DiaryDay[] {
  const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp);
  const byKey = new Map<string, DiaryEntry>();
  const order: DiaryEntry[] = [];
  for (const event of sorted) {
    const key = `${dayStart(event.timestamp)}|${event.toolId}|${event.subject ?? ""}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    if (order.length >= limit) continue;
    const entry: DiaryEntry = {
      key,
      toolId: event.toolId,
      title: event.toolTitle,
      subject: event.subject,
      at: event.timestamp,
      count: 1,
    };
    byKey.set(key, entry);
    order.push(entry);
  }

  const days: DiaryDay[] = [];
  for (const entry of order) {
    const label = diaryDayLabel(entry.at, now);
    const last = days[days.length - 1];
    if (last && last.label === label) last.entries.push(entry);
    else days.push({ label, entries: [entry] });
  }
  return days;
}
