import { getSavedStudyPlan } from "./study-plan-calendar";

export type NotificationType = "update" | "study-plan";

export interface SiteNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** YYYY-MM-DD — used for sorting and same-day dedup. */
  date: string;
  createdAt: string;
  read: boolean;
}

const NOTIFICATIONS_KEY = "spaceedu-notifications";

export const NOTIFICATIONS_UPDATED_EVENT = "spaceedu-notifications-updated";

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
}

/** Site changelog seed — merged in once per browser, never duplicated. */
const SITE_UPDATE_SEED: Array<Omit<SiteNotification, "read">> = [
  {
    id: "update-personal-greeting",
    type: "update",
    title: "პერსონალური მისალმება",
    body: "დეშბორდი და პროფილი ახლა შენს რეგისტრირებულ სახელს გიჩვენებს.",
    date: "2026-08-05",
    createdAt: "2026-08-05T09:00:00.000Z",
  },
  {
    id: "update-quiz-question-count",
    type: "update",
    title: "აირჩიე კითხვების რაოდენობა",
    body: "Active Recall Quiz-ში ახლა შეგიძლია აირჩიო რამდენი კითხვა გინდა — 3-დან 25-მდე.",
    date: "2026-08-04",
    createdAt: "2026-08-04T09:00:00.000Z",
  },
  {
    id: "update-study-calendar",
    type: "update",
    title: "სასწავლო კალენდარი დეშბორდზე",
    body: "გადაიტანე შენი სასწავლო გეგმა დეშბორდის კალენდარში და მონიშნე დღეები დასრულებულად.",
    date: "2026-08-03",
    createdAt: "2026-08-03T09:00:00.000Z",
  },
  {
    id: "update-research-platform",
    type: "update",
    title: "მასალა → ანალიზი განახლდა",
    body: "PDF, ფოტო, ტექსტი და აუდიო მასალის ერთად ატვირთვა და ანალიზი, ხმით წაკითხვის ფუნქციით.",
    date: "2026-08-02",
    createdAt: "2026-08-02T09:00:00.000Z",
  },
  {
    id: "update-abit-study-plan",
    type: "update",
    title: "ახალი სასწავლო გეგმის გენერატორი",
    body: "აბიტურიენტის სივრცეს ახლა აქვს საკუთარი, მარტივი საგნების და თემების ამომრჩევი გეგმის გენერატორი.",
    date: "2026-08-01",
    createdAt: "2026-08-01T09:00:00.000Z",
  },
];

function readAll(): SiteNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SiteNotification[];
  } catch {
    return [];
  }
}

function writeAll(list: SiteNotification[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
  notifyUpdated();
}

/** Ensures the changelog seed exists (added once, without resetting read state of anything else). */
function ensureSeeded(list: SiteNotification[]): SiteNotification[] {
  const existingIds = new Set(list.map((item) => item.id));
  const missing = SITE_UPDATE_SEED.filter((item) => !existingIds.has(item.id)).map((item) => ({
    ...item,
    read: false,
  }));
  if (missing.length === 0) return list;
  return [...list, ...missing];
}

export function getAllNotifications(): SiteNotification[] {
  const original = readAll();
  const seeded = ensureSeeded(original);
  if (seeded.length !== original.length) {
    writeAll(seeded);
  }
  return [...seeded].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

export function getUnreadCount(): number {
  return getAllNotifications().filter((item) => !item.read).length;
}

export function markNotificationRead(id: string): void {
  const list = readAll();
  const next = list.map((item) => (item.id === id ? { ...item, read: true } : item));
  writeAll(next);
}

export function markAllNotificationsRead(): void {
  const list = readAll();
  const next = list.map((item) => ({ ...item, read: true }));
  writeAll(next);
}

/**
 * Checks the saved study plan for a day matching today's date, and — if
 * one exists and no reminder has been generated for today yet — adds a
 * fresh "today's study" notification. Safe to call on every page load.
 */
export function ensureDailyStudyPlanNotification(): void {
  if (typeof window === "undefined") return;

  const plan = getSavedStudyPlan();
  if (!plan) return;

  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = plan.days.find((day) => day.date === today);
  if (!todayEntry) return;

  const id = `study-plan-${today}`;
  const list = readAll();
  if (list.some((item) => item.id === id)) return;

  const hoursLabel = `${todayEntry.hours} საათი`;
  const notification: SiteNotification = {
    id,
    type: "study-plan",
    title: "დღეს გეგმაში გაქვს",
    body: `${todayEntry.topics.join(", ")} — ${hoursLabel}`,
    date: today,
    createdAt: new Date().toISOString(),
    read: false,
  };

  writeAll([...list, notification]);
}
