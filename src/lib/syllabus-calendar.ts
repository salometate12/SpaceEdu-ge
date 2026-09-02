export type SyllabusMilestoneType = "midterm" | "quiz" | "deadline";

export interface SyllabusMilestone {
  id: string;
  title: string;
  /** Real, placeable calendar date — always YYYY-MM-DD, resolved server-side. */
  date: string;
  /** Week-of-semester label, e.g. "8", as stated in the syllabus. */
  week?: string;
  /** Short topic/chapter this milestone covers, if the syllabus states one. */
  topic?: string;
  type: SyllabusMilestoneType;
}

export interface DashboardCalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  type: SyllabusMilestoneType;
  source: "syllabus" | "manual";
}

const SYLLABUS_MILESTONES_KEY = "spaceedu-syllabus-generated-milestones";
const DASHBOARD_CALENDAR_KEY = "spaceedu-dashboard-calendar-events";

export function getGeneratedMilestones(): SyllabusMilestone[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SYLLABUS_MILESTONES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SyllabusMilestone[];
  } catch {
    return [];
  }
}

export function setGeneratedMilestones(milestones: SyllabusMilestone[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SYLLABUS_MILESTONES_KEY, JSON.stringify(milestones));
}

export function getDashboardCalendarEvents(): DashboardCalendarEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DASHBOARD_CALENDAR_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DashboardCalendarEvent[];
  } catch {
    return [];
  }
}

/** Folds week/topic into a human-readable description, since DashboardCalendarEvent
 * doesn't have dedicated fields for them but already renders `description`. */
function describeMilestone(milestone: SyllabusMilestone): string | undefined {
  const parts: string[] = [];
  if (milestone.week) parts.push(`კვირა ${milestone.week}`);
  if (milestone.topic) parts.push(milestone.topic);
  return parts.length > 0 ? parts.join(" — ") : undefined;
}

export function addMilestoneToDashboardCalendar(
  milestone: SyllabusMilestone,
): DashboardCalendarEvent[] {
  const existing = getDashboardCalendarEvents();
  const event: DashboardCalendarEvent = {
    id: milestone.id,
    title: milestone.title,
    date: milestone.date,
    description: describeMilestone(milestone),
    type: milestone.type,
    source: "syllabus",
  };
  const next = [...existing.filter((item) => item.id !== milestone.id), event];
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DASHBOARD_CALENDAR_KEY, JSON.stringify(next));
    notifyCalendarUpdated();
  }
  return next;
}

export function isMilestoneOnDashboard(id: string): boolean {
  return getDashboardCalendarEvents().some((event) => event.id === id);
}

export interface ManualCalendarEventInput {
  title: string;
  date: string;
  time?: string;
  description?: string;
  type: SyllabusMilestoneType;
}

export function addManualCalendarEvent(
  input: ManualCalendarEventInput,
): DashboardCalendarEvent[] {
  const existing = getDashboardCalendarEvents();
  const event: DashboardCalendarEvent = {
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    date: input.date,
    time: input.time,
    description: input.description,
    type: input.type,
    source: "manual",
  };
  const next = [...existing, event];
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DASHBOARD_CALENDAR_KEY, JSON.stringify(next));
    notifyCalendarUpdated();
  }
  return next;
}

export function updateDashboardCalendarEvent(
  id: string,
  updates: ManualCalendarEventInput,
): DashboardCalendarEvent[] {
  const next = getDashboardCalendarEvents().map((event) =>
    event.id === id
      ? {
          ...event,
          title: updates.title,
          date: updates.date,
          time: updates.time,
          description: updates.description,
          type: updates.type,
        }
      : event,
  );
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DASHBOARD_CALENDAR_KEY, JSON.stringify(next));
    notifyCalendarUpdated();
  }
  return next;
}

export function removeDashboardCalendarEvent(id: string): DashboardCalendarEvent[] {
  const next = getDashboardCalendarEvents().filter((event) => event.id !== id);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DASHBOARD_CALENDAR_KEY, JSON.stringify(next));
    notifyCalendarUpdated();
  }
  return next;
}

export const CALENDAR_UPDATED_EVENT = "spaceedu-calendar-updated";

export function notifyCalendarUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CALENDAR_UPDATED_EVENT));
}

/** Legacy demo IDs shipped before real AI wiring — remove from browser storage. */
const LEGACY_MOCK_MILESTONE_IDS = new Set(["ms-1", "ms-2", "ms-3"]);

export function clearLegacySyllabusMockData(): void {
  if (typeof window === "undefined") return;

  const stored = getGeneratedMilestones();
  const cleaned = stored.filter((item) => !LEGACY_MOCK_MILESTONE_IDS.has(item.id));
  if (cleaned.length !== stored.length) {
    if (cleaned.length === 0) {
      window.localStorage.removeItem(SYLLABUS_MILESTONES_KEY);
    } else {
      setGeneratedMilestones(cleaned);
    }
  }

  const events = getDashboardCalendarEvents();
  const cleanedEvents = events.filter(
    (event) => !LEGACY_MOCK_MILESTONE_IDS.has(event.id),
  );
  if (cleanedEvents.length !== events.length) {
    if (cleanedEvents.length === 0) {
      window.localStorage.removeItem(DASHBOARD_CALENDAR_KEY);
    } else {
      window.localStorage.setItem(
        DASHBOARD_CALENDAR_KEY,
        JSON.stringify(cleanedEvents),
      );
    }
    notifyCalendarUpdated();
  }
}
