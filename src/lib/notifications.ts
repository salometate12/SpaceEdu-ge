import { getCurrentStreak, getActiveDatesThisWeek } from "./daily-streak";
import {
  localDay,
  migrateNotification,
  pruneNotifications,
  unreadCount,
  NOTIFICATIONS_MAX_AGE_DAYS,
  type AppNotification,
} from "./notification-feed";
import { getSavedStudyPlan, toggleStudyPlanDayDone, type StudyPlanSpace } from "./study-plan-calendar";
import { getDashboardCalendarEvents, getGeneratedMilestones } from "./syllabus-calendar";
import { STUDY_PLAN_BOARD_KEY, parseSavedPlan, toggleDone as toggleBoardDay } from "./study-plan-board";
import { NOTIFICATIONS_KEY, NOTIFICATIONS_UPDATED_EVENT } from "./user-data-keys";
import { userStore } from "./user-data";

export type { AppNotification } from "./notification-feed";
export { NOTIFICATIONS_UPDATED_EVENT };

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
}

/** Site news — added once each (by id), while it's recent enough to keep. */
const NEWS: AppNotification[] = [
  {
    id: "news-notifications-redesign",
    kind: "news",
    title: "შეტყობინებები განახლდა",
    body: "დღეებად დალაგებული სია, ფილტრები და გეგმის მონიშვნა პირდაპირ შეხსენებიდან.",
    createdAt: "2026-10-22T09:00:00.000Z",
    href: "/notifications",
  },
];

/** The subject of the saved plan that has a day on `date`. */
function planSubjectOn(date: string): string | null {
  for (const space of ["student", "abiturient"] as StudyPlanSpace[]) {
    const plan = getSavedStudyPlan(space);
    if (plan?.days.some((day) => day.date === date)) return plan.subject?.trim() || null;
  }
  return null;
}

function readStored(): unknown[] {
  if (typeof window === "undefined") return [];
  const stored = userStore.get<unknown>(NOTIFICATIONS_KEY, []);
  return Array.isArray(stored) ? stored : [];
}

function writeAll(list: AppNotification[]): void {
  if (typeof window === "undefined") return;
  userStore.set(NOTIFICATIONS_KEY, list);
  notifyUpdated();
}

/**
 * Every notification on the current model (old ones moved over, news
 * added, the list kept small). Writes back only when something changed,
 * so calling it again is a no-op.
 */
export function getAllNotifications(now: Date = new Date()): AppNotification[] {
  const stored = readStored();
  const migrated = stored.map((item) => migrateNotification(item, planSubjectOn)).filter((item): item is AppNotification => item !== null);
  const cutoff = now.getTime() - NOTIFICATIONS_MAX_AGE_DAYS * 86_400_000;
  const ids = new Set(migrated.map((item) => item.id));
  const news = NEWS.filter((item) => !ids.has(item.id) && new Date(item.createdAt).getTime() >= cutoff).map((item) => ({ ...item, readAt: null }));
  const next = pruneNotifications([...migrated, ...news], now);
  if (JSON.stringify(next) !== JSON.stringify(stored)) writeAll(next);
  return next;
}

export function getUnreadCount(): number {
  return unreadCount(getAllNotifications());
}

function update(change: (item: AppNotification) => AppNotification, ids?: Set<string>): void {
  writeAll(getAllNotifications().map((item) => (!ids || ids.has(item.id) ? change(item) : item)));
}

export function markNotificationRead(id: string): void {
  update((item) => (item.readAt ? item : { ...item, readAt: new Date().toISOString() }), new Set([id]));
}

export function markNotificationsRead(ids: string[]): void {
  update((item) => (item.readAt ? item : { ...item, readAt: new Date().toISOString() }), new Set(ids));
}

export function markNotificationUnread(id: string): void {
  update((item) => ({ ...item, readAt: null }), new Set([id]));
}

export function markAllNotificationsRead(): void {
  const now = new Date().toISOString();
  update((item) => (item.readAt || item.deletedAt ? item : { ...item, readAt: now }));
}

/** Hidden, not removed: another device's copy mustn't bring it back. */
export function deleteNotification(id: string): void {
  update((item) => ({ ...item, deletedAt: new Date().toISOString() }), new Set([id]));
}

export function restoreNotification(id: string): void {
  update((item) => ({ ...item, deletedAt: null }), new Set([id]));
}

function addIfMissing(list: AppNotification[], fresh: AppNotification[]): AppNotification[] {
  const ids = new Set(list.map((item) => item.id));
  return [...list, ...fresh.filter((item) => !ids.has(item.id))];
}

const MORNING_HOUR = 6;

const DUE_TYPE: Record<string, string> = { deadline: "დედლაინი", midterm: "შუალედური", final: "ფინალური", quiz: "ქვიზი" };
const MONTHS_SHORT = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];

/**
 * Today's reminders, made once each (stable ids, so calling it on every
 * page load is safe): the study-plan day with its subject, deadlines three
 * days and one day ahead, and a morning streak nudge.
 */
export function ensureGeneratedNotifications(now: Date = new Date()): void {
  if (typeof window === "undefined") return;
  const today = localDay(now);
  const iso = now.toISOString();
  const fresh: AppNotification[] = [];

  // The study-plan day.
  for (const space of ["student", "abiturient"] as StudyPlanSpace[]) {
    const plan = getSavedStudyPlan(space);
    const day = plan?.days.find((item) => item.date === today);
    if (!plan || !day) continue;
    const subject = plan.subject?.trim();
    fresh.push({
      id: `study-plan-${today}`,
      kind: "plan",
      title: subject ? `დღეს გეგმაში: ${subject}` : "დღეს გეგმაში",
      body: `${day.topics.join(", ")} · ${day.hours} საათი`,
      createdAt: iso,
      readAt: null,
      href: space === "student" ? `/study-plan?day=${today}` : "/study-plan/abit",
      actions: [
        { id: "open", label: "გეგმის გახსნა" },
        { id: "done", label: "შესრულებულია" },
      ],
      meta: { subject, planDayId: today, space },
    });
    break;
  }

  // Deadlines: three days and one day ahead.
  const seen = new Set<string>();
  const dated = [...getDashboardCalendarEvents(), ...getGeneratedMilestones()].filter((event) => {
    if (!event.date || event.type === "study" || seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
  for (const event of dated) {
    const [y, m, d] = (event.date as string).split("-").map(Number);
    const days = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86_400_000);
    if (days !== 3 && days !== 1) continue;
    fresh.push({
      id: `deadline-${event.id}-${days}`,
      kind: "deadline",
      title: days === 1 ? `ხვალ: ${event.title}` : `3 დღეში: ${event.title}`,
      // „შუალედური · 24 ოქტ“, with the subject when the syllabus is bound to one.
      body: [
        "subject" in event && event.subject ? event.subject : null,
        DUE_TYPE[event.type] ?? null,
        `${d} ${MONTHS_SHORT[m - 1]}`,
      ]
        .filter(Boolean)
        .join(" · "),
      createdAt: iso,
      readAt: null,
      href: "/study-plan",
      meta: { dueDate: event.date as string, subject: "subject" in event ? event.subject : undefined },
    });
  }

  // The streak, in the morning, when today has nothing yet.
  const streak = getCurrentStreak();
  if (streak > 0 && now.getHours() >= MORNING_HOUR && !getActiveDatesThisWeek().includes(today)) {
    fresh.push({
      id: `streak-${today}`,
      kind: "streak",
      title: `${streak} დღიანი სტრიქი`,
      body: "დღესაც ისწავლე ცოტა, რომ სტრიქი არ გაწყდეს.",
      createdAt: iso,
      readAt: null,
      href: "/dashboard-student",
    });
  }

  if (fresh.length === 0) return;
  const list = getAllNotifications(now);
  const next = addIfMissing(list, fresh);
  if (next.length !== list.length) writeAll(pruneNotifications(next, now));
}

/** @deprecated kept for older callers: makes all of today's reminders. */
export function ensureDailyStudyPlanNotification(): void {
  ensureGeneratedNotifications();
}

/**
 * „✓ შესრულებულია“ on today's plan reminder: the day is ticked in the
 * dashboard's study plan (and on the study-plan page, when it has that day).
 */
export function markPlanDayDone(notification: AppNotification): boolean {
  const date = notification.meta?.planDayId;
  const space = notification.meta?.space ?? "student";
  if (!date) return false;
  const plan = getSavedStudyPlan(space);
  if (plan && !plan.doneDates.includes(date)) toggleStudyPlanDayDone(space, date);
  try {
    const board = parseSavedPlan(window.localStorage.getItem(STUDY_PLAN_BOARD_KEY));
    if (board && board.plan.some((day) => day.date === date) && !board.done.includes(date)) {
      window.localStorage.setItem(STUDY_PLAN_BOARD_KEY, JSON.stringify({ ...board, done: toggleBoardDay(board.done, date) }));
    }
  } catch {
    // the study-plan page's copy stays as it was
  }
  markNotificationRead(notification.id);
  return true;
}

/** Whether today's plan day is already done. */
export function isPlanDayDone(notification: AppNotification): boolean {
  const date = notification.meta?.planDayId;
  if (!date) return false;
  return Boolean(getSavedStudyPlan(notification.meta?.space ?? "student")?.doneDates.includes(date));
}
