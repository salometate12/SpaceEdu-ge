export interface ToolUsageEvent {
  id: string;
  toolId: string;
  toolTitle: string;
  subject: string | null;
  timestamp: number;
}

const USAGE_STORAGE_KEY = "spaceedu-tool-usage";
const ACTIVE_SUBJECT_KEY = "spaceedu-active-subject";
const MAX_EVENTS = 300;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getActiveSubject(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(ACTIVE_SUBJECT_KEY);
}

export function setActiveSubject(subject: string | null): void {
  if (!isBrowser()) return;
  if (subject) {
    window.localStorage.setItem(ACTIVE_SUBJECT_KEY, subject);
  } else {
    window.localStorage.removeItem(ACTIVE_SUBJECT_KEY);
  }
}

export function getToolUsageEvents(): ToolUsageEvent[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ToolUsageEvent[]) : [];
  } catch {
    return [];
  }
}

export function recordToolUsage(toolId: string, toolTitle: string): void {
  if (!isBrowser()) return;
  const events = getToolUsageEvents();
  const event: ToolUsageEvent = {
    id: crypto.randomUUID(),
    toolId,
    toolTitle,
    subject: getActiveSubject(),
    timestamp: Date.now(),
  };
  const next = [...events, event].slice(-MAX_EVENTS);
  window.localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(next));
}

export function usageByTool(events: ToolUsageEvent[]): Record<string, number> {
  return events.reduce<Record<string, number>>((acc, event) => {
    acc[event.toolId] = (acc[event.toolId] ?? 0) + 1;
    return acc;
  }, {});
}

export function usageBySubject(events: ToolUsageEvent[]): Record<string, number> {
  return events.reduce<Record<string, number>>((acc, event) => {
    const key = event.subject ?? "ზოგადი";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function isSameDay(timestamp: number, date: Date): boolean {
  const eventDate = new Date(timestamp);
  return (
    eventDate.getFullYear() === date.getFullYear() &&
    eventDate.getMonth() === date.getMonth() &&
    eventDate.getDate() === date.getDate()
  );
}

export function usageOnDay(events: ToolUsageEvent[], date: Date): number {
  return events.filter((event) => isSameDay(event.timestamp, date)).length;
}

const WEEKDAY_LABELS = ["კვ", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"];

export function usageLast7Days(
  events: ToolUsageEvent[],
): { label: string; count: number }[] {
  const today = new Date();
  const result: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    result.push({ label: WEEKDAY_LABELS[day.getDay()], count: usageOnDay(events, day) });
  }
  return result;
}
