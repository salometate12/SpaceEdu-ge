export type SyllabusMilestoneType = "midterm" | "quiz" | "deadline";

export interface SyllabusMilestone {
  id: string;
  title: string;
  date: string;
  type: SyllabusMilestoneType;
}

export interface DashboardCalendarEvent {
  id: string;
  title: string;
  date: string;
  type: SyllabusMilestoneType;
  source: "syllabus";
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

export function addMilestoneToDashboardCalendar(
  milestone: SyllabusMilestone,
): DashboardCalendarEvent[] {
  const existing = getDashboardCalendarEvents();
  const event: DashboardCalendarEvent = {
    id: milestone.id,
    title: milestone.title,
    date: milestone.date,
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
