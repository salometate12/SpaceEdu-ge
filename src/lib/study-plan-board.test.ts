import { describe, expect, it } from "vitest";
import { checkStudyPlanForm, dayChip, daysUntil, parseSavedPlan, splitTopics, toggleDone } from "./study-plan-board";

const TODAY = "2026-10-23";

describe("study plan form", () => {
  it("says what's missing, in Georgian", () => {
    expect(checkStudyPlanForm({ subject: " ", examDate: "" }, TODAY)).toEqual({
      subject: "აირჩიე საგანი",
      examDate: "აირჩიე გამოცდის თარიღი",
      longRange: false,
    });
  });

  it("wants a date in the future", () => {
    expect(checkStudyPlanForm({ subject: "სტატისტიკა", examDate: "2026-10-23" }, TODAY).examDate).toBe("თარიღი მომავალში უნდა იყოს");
    expect(checkStudyPlanForm({ subject: "სტატისტიკა", examDate: "2026-10-24" }, TODAY)).toEqual({ longRange: false });
  });

  it("only notes a date more than 30 days away", () => {
    expect(checkStudyPlanForm({ subject: "სტატისტიკა", examDate: "2026-12-20" }, TODAY)).toEqual({ longRange: true });
    expect(daysUntil("2026-11-02", TODAY)).toBe(10);
  });
});

describe("study plan topics and days", () => {
  it("adds topics from comma-separated text, once each", () => {
    expect(splitTopics("ელასტიურობა, ბაზარი ,, ელასტიურობა", ["ბაზარი"])).toEqual(["ბაზარი", "ელასტიურობა"]);
  });

  it("labels a strip day and toggles done", () => {
    expect(dayChip("2026-10-28")).toEqual({ weekday: "ოთხ", day: 28 });
    expect(toggleDone(["2026-10-24"], "2026-10-25")).toEqual(["2026-10-24", "2026-10-25"]);
    expect(toggleDone(["2026-10-24"], "2026-10-24")).toEqual([]);
  });

  it("restores a saved plan and ignores broken data", () => {
    expect(parseSavedPlan("nope")).toBeNull();
    expect(parseSavedPlan(JSON.stringify({ subject: "ა" }))).toBeNull();
    const saved = parseSavedPlan(
      JSON.stringify({ subject: "ა", examDate: "2026-11-01", plan: [], done: ["2026-10-24"], advice: "", hoursPerDay: 2, totalDays: 0, createdAt: 1 }),
    );
    expect(saved).toMatchObject({ done: ["2026-10-24"], topics: [], general: false });
  });
});
