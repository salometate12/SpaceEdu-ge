/**
 * Notifications as pure functions: the model, moving the old stored ones
 * onto it, grouping by day, the time shown, folding older plan reminders
 * into one row, the filter tabs and pruning. Storage and creation are in
 * `notifications.ts`.
 */

export type NotificationKind = "plan" | "deadline" | "streak" | "news" | "system";

export interface NotificationAction {
  id: "open" | "done";
  label: string;
}

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  /** „დღეს გეგმაში: ოპერაციული სისტემები“ */
  title: string;
  /** „შესავალი, OS-ის ტიპები · 2 საათი“ */
  body?: string;
  /** ISO */
  createdAt: string;
  readAt?: string | null;
  /** Hidden (kept so another device's copy doesn't bring it back). */
  deletedAt?: string | null;
  href?: string;
  actions?: NotificationAction[];
  meta?: { subject?: string; planDayId?: string; dueDate?: string; space?: "student" | "abiturient" };
}

export const NOTIFICATIONS_LIMIT = 200;
export const NOTIFICATIONS_MAX_AGE_DAYS = 60;

/* --- The old stored shape ------------------------------------------------ */

interface LegacyNotification {
  id: string;
  type: "update" | "study-plan";
  title: string;
  body?: string;
  date?: string;
  createdAt?: string;
  read?: boolean;
}

function isLegacy(value: unknown): value is LegacyNotification {
  return !!value && typeof value === "object" && "type" in value && !("kind" in value);
}

/**
 * One stored item on the current model: old ones are moved over (the same
 * id, so doing it twice changes nothing); broken ones are dropped.
 */
export function migrateNotification(value: unknown, planSubject?: (date: string) => string | null): AppNotification | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<AppNotification> & Record<string, unknown>;
  if (typeof item.id !== "string") return null;
  if (!isLegacy(value)) {
    return typeof item.kind === "string" && typeof item.title === "string" && typeof item.createdAt === "string"
      ? (item as AppNotification)
      : null;
  }
  const legacy = value;
  const createdAt = legacy.createdAt ?? (legacy.date ? `${legacy.date}T09:00:00.000Z` : new Date(0).toISOString());
  const readAt = legacy.read ? createdAt : null;
  if (legacy.type === "study-plan") {
    const date = legacy.date ?? createdAt.slice(0, 10);
    const subject = planSubject?.(date) ?? null;
    // „საგანი — 2 საათი“ → „საგანი · 2 საათი“
    const body = legacy.body?.replace(/\s—\s(\d+ საათი)$/, " · $1");
    return {
      id: legacy.id,
      kind: "plan",
      title: subject ? `დღეს გეგმაში: ${subject}` : "დღეს გეგმაში",
      body,
      createdAt,
      readAt,
      meta: { planDayId: date, subject: subject ?? undefined },
    };
  }
  return { id: legacy.id, kind: "news", title: legacy.title, body: legacy.body, createdAt, readAt };
}

/* --- Days ---------------------------------------------------------------- */

const pad = (value: number) => String(value).padStart(2, "0");

/** The local calendar day of a moment, YYYY-MM-DD. */
export function localDay(at: Date): string {
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

function dayDiff(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

export type NotificationGroupId = "today" | "yesterday" | "week" | "earlier";

export const GROUP_LABEL: Record<NotificationGroupId, string> = {
  today: "დღეს",
  yesterday: "გუშინ",
  week: "ამ კვირაში",
  earlier: "ადრეული",
};

export function groupOf(createdAt: string, now: Date): NotificationGroupId {
  const days = dayDiff(localDay(new Date(createdAt)), localDay(now));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return "week";
  return "earlier";
}

const WEEKDAYS_SHORT = ["კვ", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"];
const MONTHS_SHORT = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];

/** Today and yesterday „09:00“, this week „ორშ“, before that „12 ოქტ“. */
export function formatNotificationTime(createdAt: string, now: Date): string {
  const at = new Date(createdAt);
  const group = groupOf(createdAt, now);
  if (group === "today" || group === "yesterday") return `${pad(at.getHours())}:${pad(at.getMinutes())}`;
  if (group === "week") return WEEKDAYS_SHORT[at.getDay()];
  return `${at.getDate()} ${MONTHS_SHORT[at.getMonth()]}`;
}

/* --- Filters ------------------------------------------------------------- */

export type NotificationFilter = "all" | "reminders" | "deadlines" | "news";

export const FILTER_KINDS: Record<Exclude<NotificationFilter, "all">, NotificationKind[]> = {
  reminders: ["plan", "streak"],
  deadlines: ["deadline"],
  news: ["news", "system"],
};

export function parseFilter(value: string | null): NotificationFilter {
  return value === "reminders" || value === "deadlines" || value === "news" ? value : "all";
}

export function visibleNotifications(list: AppNotification[], filter: NotificationFilter = "all"): AppNotification[] {
  return list
    .filter((item) => !item.deletedAt && (filter === "all" || FILTER_KINDS[filter].includes(item.kind)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function unreadCount(list: AppNotification[]): number {
  return list.filter((item) => !item.deletedAt && !item.readAt).length;
}

/* --- Groups and folding -------------------------------------------------- */

/** A row: one notification, or older plan reminders folded together. */
export type FeedRow =
  | { type: "single"; item: AppNotification }
  | { type: "plans"; id: string; items: AppNotification[] };

export interface FeedGroup {
  id: NotificationGroupId;
  label: string;
  rows: FeedRow[];
  /** Notifications in the group (a folded row counts all of its items). */
  count: number;
}

/**
 * By day, newest first. In „ამ კვირაში“ and „ადრეული“ two or more plan
 * reminders become one row („გეგმის შეხსენებები · 4“); „დღეს“ and
 * „გუშინ“ keep them apart.
 */
export function groupFeed(list: AppNotification[], now: Date): FeedGroup[] {
  const order: NotificationGroupId[] = ["today", "yesterday", "week", "earlier"];
  const groups = order.map((id) => ({ id, label: GROUP_LABEL[id], rows: [] as FeedRow[], count: 0 }));
  const byId = Object.fromEntries(groups.map((group) => [group.id, group]));
  const plans: Partial<Record<NotificationGroupId, AppNotification[]>> = {};

  for (const item of [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    const group = groupOf(item.createdAt, now);
    byId[group].count += 1;
    if (item.kind === "plan" && (group === "week" || group === "earlier")) {
      (plans[group] ??= []).push(item);
      // Placeholder at the position of the newest one.
      if (plans[group]!.length === 1) byId[group].rows.push({ type: "plans", id: `plans-${group}`, items: plans[group]! });
      continue;
    }
    byId[group].rows.push({ type: "single", item });
  }
  // A „fold“ of one is just that one.
  for (const group of groups) {
    group.rows = group.rows.map((row) => (row.type === "plans" && row.items.length === 1 ? { type: "single", item: row.items[0] } : row));
  }
  return groups.filter((group) => group.rows.length > 0);
}

/** „შესავალი, OS-ის ტიპები“ — the first two topics of folded plan reminders. */
export function foldedPlanSummary(items: AppNotification[]): string {
  const topics: string[] = [];
  for (const item of items) {
    for (const topic of (item.body ?? "").split(" · ")[0].split(/,\s*/)) {
      if (topic && !topics.includes(topic)) topics.push(topic);
      if (topics.length === 2) return topics.join(", ");
    }
  }
  return topics.join(", ");
}

/* --- Keeping the list small ---------------------------------------------- */

/** At most 200, nothing older than 60 days (tombstones included). */
export function pruneNotifications(list: AppNotification[], now: Date): AppNotification[] {
  const cutoff = now.getTime() - NOTIFICATIONS_MAX_AGE_DAYS * 86_400_000;
  return [...list]
    .filter((item) => new Date(item.createdAt).getTime() >= cutoff)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, NOTIFICATIONS_LIMIT);
}
