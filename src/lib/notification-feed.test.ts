import { describe, expect, it } from "vitest";
import {
  foldedPlanSummary,
  formatNotificationTime,
  groupFeed,
  groupOf,
  migrateNotification,
  parseFilter,
  pruneNotifications,
  unreadCount,
  visibleNotifications,
  type AppNotification,
} from "./notification-feed";

// Thursday 22 Oct 2026, 15:00 local.
const NOW = new Date(2026, 9, 22, 15, 0);
const at = (day: number, hour = 9, month = 9) => new Date(2026, month, day, hour, 0).toISOString();
const n = (id: string, createdAt: string, over: Partial<AppNotification> = {}): AppNotification => ({
  id,
  kind: "news",
  title: id,
  createdAt,
  ...over,
});

describe("notifications: moving old ones over", () => {
  it("turns an old plan reminder into one with the subject", () => {
    const old = { id: "study-plan-2026-10-20", type: "study-plan", title: "დღეს გეგმაში გაქვს", body: "შესავალი, OS-ის ტიპები — 2 საათი", date: "2026-10-20", createdAt: "2026-10-20T06:00:00.000Z", read: true };
    expect(migrateNotification(old, () => "ოპერაციული სისტემები")).toEqual({
      id: "study-plan-2026-10-20",
      kind: "plan",
      title: "დღეს გეგმაში: ოპერაციული სისტემები",
      body: "შესავალი, OS-ის ტიპები · 2 საათი",
      createdAt: "2026-10-20T06:00:00.000Z",
      readAt: "2026-10-20T06:00:00.000Z",
      meta: { planDayId: "2026-10-20", subject: "ოპერაციული სისტემები" },
    });
  });

  it("turns site updates into news and is idempotent", () => {
    const old = { id: "update-x", type: "update", title: "სიახლე", body: "…", date: "2026-08-05", createdAt: "2026-08-05T09:00:00.000Z", read: false };
    const once = migrateNotification(old)!;
    expect(once).toMatchObject({ kind: "news", readAt: null });
    expect(migrateNotification(once)).toEqual(once);
    expect(migrateNotification({ nope: 1 })).toBeNull();
  });
});

describe("notifications: days and times", () => {
  it("groups by local day", () => {
    expect(groupOf(at(22, 8), NOW)).toBe("today");
    expect(groupOf(at(21, 23), NOW)).toBe("yesterday");
    expect(groupOf(at(17), NOW)).toBe("week");
    expect(groupOf(at(15), NOW)).toBe("earlier");
  });

  it("shows the time, the weekday or the date", () => {
    expect(formatNotificationTime(at(22, 9), NOW)).toBe("09:00");
    expect(formatNotificationTime(at(21, 18), NOW)).toBe("18:00");
    expect(formatNotificationTime(at(19), NOW)).toBe("ორშ");
    expect(formatNotificationTime(at(12), NOW)).toBe("12 ოქტ");
  });
});

describe("notifications: groups and folding", () => {
  const plan = (id: string, createdAt: string, body: string) => n(id, createdAt, { kind: "plan", body });
  const list = [
    plan("p-today", at(22), "ა, ბ · 2 საათი"),
    plan("p-yesterday", at(21), "გ · 2 საათი"),
    plan("p-mon", at(19), "შესავალი, OS-ის ტიპები · 2 საათი"),
    plan("p-sun", at(18), "პროცესები · 1 საათი"),
    n("news-week", at(17)),
    plan("p-old1", at(10), "ა · 1 საათი"),
    plan("p-old2", at(9), "ბ · 1 საათი"),
    n("news-old", at(1)),
  ];

  it("keeps today's plan apart and folds older ones", () => {
    const groups = groupFeed(list, NOW);
    expect(groups.map((group) => group.id)).toEqual(["today", "yesterday", "week", "earlier"]);
    expect(groups[0].rows).toEqual([{ type: "single", item: list[0] }]);
    expect(groups[2].rows.map((row) => (row.type === "plans" ? `plans:${row.items.length}` : row.item.id))).toEqual(["plans:2", "news-week"]);
    expect(groups[3].rows.map((row) => (row.type === "plans" ? `plans:${row.items.length}` : row.item.id))).toEqual(["plans:2", "news-old"]);
    expect(groups[3].count).toBe(3);
  });

  it("doesn't fold a single plan reminder", () => {
    const groups = groupFeed([plan("only", at(18), "ა · 1 საათი")], NOW);
    expect(groups[0].rows[0]).toMatchObject({ type: "single" });
  });

  it("sums up folded reminders by their first two topics", () => {
    expect(foldedPlanSummary([list[2], list[3]])).toBe("შესავალი, OS-ის ტიპები");
  });
});

describe("notifications: filters, unread, pruning", () => {
  const list = [
    n("plan", at(22), { kind: "plan" }),
    n("streak", at(22), { kind: "streak", readAt: at(22) }),
    n("deadline", at(21), { kind: "deadline" }),
    n("system", at(20), { kind: "system" }),
    n("gone", at(20), { deletedAt: at(21) }),
  ];

  it("filters by tab and hides deleted ones", () => {
    expect(visibleNotifications(list, "reminders").map((item) => item.id)).toEqual(["plan", "streak"]);
    expect(visibleNotifications(list, "news").map((item) => item.id)).toEqual(["system"]);
    expect(visibleNotifications(list).map((item) => item.id)).not.toContain("gone");
    expect(parseFilter("deadlines")).toBe("deadlines");
    expect(parseFilter("x")).toBe("all");
  });

  it("counts the unread", () => {
    expect(unreadCount(list)).toBe(3);
  });

  it("keeps 200 at most and nothing older than 60 days", () => {
    const many = Array.from({ length: 250 }, (_, index) => n(`n${index}`, new Date(NOW.getTime() - index * 3_600_000).toISOString()));
    expect(pruneNotifications(many, NOW)).toHaveLength(200);
    expect(pruneNotifications([n("old", at(1, 9, 7))], NOW)).toEqual([]);
  });
});
