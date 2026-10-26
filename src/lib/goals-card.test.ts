import { describe, expect, it } from "vitest";
import type { DailyGoal } from "./profile";
import {
  carryOver,
  goalCategory,
  goalMotivation,
  goalSuggestions,
  goalsForDay,
  migrateGoals,
  pruneGoals,
  shiftDay,
  unfinishedYesterday,
} from "./goals-card";

const TODAY = "2026-10-26";
const goal = (id: string, over: Partial<DailyGoal> = {}): DailyGoal => ({ id, text: id, done: false, type: "study", date: TODAY, ...over });

describe("goalCategory / migrateGoals", () => {
  it("maps old categories and unknown ones to the four new ones", () => {
    expect(goalCategory("quiz")).toBe("study");
    expect(goalCategory("chat")).toBe("other");
    expect(goalCategory("read")).toBe("read");
    expect(goalCategory("task")).toBe("task");
    expect(goalCategory(undefined)).toBe("other");
    expect(goalCategory("weird")).toBe("other");
  });

  it("gives old goals today's date and reports a change once", () => {
    const first = migrateGoals([{ id: "a", text: "ქვიზი", done: true, type: "quiz" }, { id: "b", text: "ჩატი", done: false, type: "chat" }, null, { id: 3 }], TODAY);
    expect(first.changed).toBe(true);
    expect(first.goals).toEqual([
      { id: "a", text: "ქვიზი", done: true, type: "study", date: TODAY },
      { id: "b", text: "ჩატი", done: false, type: "other", date: TODAY },
    ]);
    const second = migrateGoals(first.goals, "2026-10-27");
    expect(second.changed).toBe(false);
    expect(second.goals[0].date).toBe(TODAY);
  });

  it("keeps minutes and the suggestion source", () => {
    const { goals, changed } = migrateGoals([goal("a", { minutes: 20, source: "plan:x" })], TODAY);
    expect(changed).toBe(false);
    expect(goals[0]).toMatchObject({ minutes: 20, source: "plan:x" });
  });

  it("returns nothing for non-arrays", () => {
    expect(migrateGoals({}, TODAY)).toEqual({ goals: [], changed: false });
  });
});

describe("day helpers", () => {
  const yesterday = shiftDay(TODAY, -1);
  const goals = [goal("done", { done: true }), goal("open"), goal("old", { date: yesterday }), goal("oldDone", { date: yesterday, done: true }), goal("ancient", { date: "2026-09-01" })];

  it("lists the day's goals with done ones last", () => {
    expect(goalsForDay(goals, TODAY).map((g) => g.id)).toEqual(["open", "done"]);
  });

  it("finds and carries over yesterday's open goals", () => {
    expect(unfinishedYesterday(goals, TODAY).map((g) => g.id)).toEqual(["old"]);
    const moved = carryOver(goals, TODAY);
    expect(goalsForDay(moved, TODAY).map((g) => g.id)).toEqual(["open", "old", "done"]);
    expect(moved.find((g) => g.id === "oldDone")?.date).toBe(yesterday);
  });

  it("drops goals older than two weeks", () => {
    expect(pruneGoals(goals, TODAY).map((g) => g.id)).not.toContain("ancient");
  });

  it("shifts across months", () => {
    expect(shiftDay("2026-11-01", -1)).toBe("2026-10-31");
  });
});

describe("goalMotivation", () => {
  it("covers empty, all done, streak already kept and goals to go", () => {
    expect(goalMotivation({ total: 0, done: 0, streak: 3, activeToday: false })).toEqual({ kind: "empty" });
    expect(goalMotivation({ total: 3, done: 3, streak: 4, activeToday: true })).toEqual({ kind: "all-done" });
    expect(goalMotivation({ total: 3, done: 1, streak: 4, activeToday: true })).toEqual({ kind: "streak-kept", streak: 4 });
    expect(goalMotivation({ total: 3, done: 1, streak: 4, activeToday: false })).toEqual({ kind: "to-go", remaining: 2, nextStreak: 5 });
    expect(goalMotivation({ total: 2, done: 0, streak: 0, activeToday: false })).toEqual({ kind: "to-go", remaining: 2, nextStreak: 1 });
  });
});

describe("goalSuggestions", () => {
  const planDay = { date: TODAY, tasks: ["ელასტიურობის თემა", "5 ამოცანა"], topics: ["ელასტიურობა"], hours: 1 };
  const deadlines = [
    { id: "far", title: "ფინალური", date: shiftDay(TODAY, 10) },
    { id: "mid", title: "შუალედური", date: shiftDay(TODAY, 1) },
    { id: "past", title: "ქვიზი 1", date: shiftDay(TODAY, -2) },
  ];

  it("offers today's plan tasks, the nearest deadline within three days and a card review", () => {
    expect(goalSuggestions({ planDay, deadlines, cardsToReview: 12 }, [], TODAY)).toEqual([
      { key: `plan:${TODAY}:0`, text: "ელასტიურობის თემა", type: "study", minutes: 30 },
      { key: "deadline:mid", text: "მოემზადე: შუალედური (ხვალ)", type: "task", minutes: 30 },
      { key: `cards:${TODAY}`, text: "ბარათების გამეორება", type: "read", minutes: 10 },
    ]);
  });

  it("hides what was already added today, by source or by text", () => {
    const goals = [goal("g1", { source: `plan:${TODAY}:0`, done: true }), goal("g2", { text: "5 ამოცანა" })];
    expect(goalSuggestions({ planDay, deadlines, cardsToReview: 0 }, goals, TODAY).map((s) => s.key)).toEqual(["deadline:mid"]);
  });

  it("uses topics when the plan day has no tasks, and ignores other days' plans", () => {
    expect(goalSuggestions({ planDay: { ...planDay, tasks: [] }, deadlines: [], cardsToReview: 0 }, [], TODAY)[0].text).toBe("ელასტიურობა");
    expect(goalSuggestions({ planDay: { ...planDay, date: shiftDay(TODAY, 1) }, deadlines: [], cardsToReview: 0 }, [], TODAY)).toEqual([]);
  });

  it("is empty without sources", () => {
    expect(goalSuggestions({ planDay: null, deadlines: [], cardsToReview: 0 }, [], TODAY)).toEqual([]);
  });
});
