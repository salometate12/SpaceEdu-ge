import { describe, expect, it } from "vitest";
import { studyPlanStatus, type SavedStudyPlan } from "./study-plan-calendar";

function plan(dates: string[], doneDates: string[]): SavedStudyPlan {
  return {
    subject: "ალგორითმები",
    savedAt: "2026-09-01T00:00:00.000Z",
    totalDays: dates.length,
    doneDates,
    days: dates.map((date) => ({
      date,
      day_name: "ორშაბათი",
      topics: ["თემა"],
      hours: 1,
      tasks: [],
      focus_level: "medium" as const,
    })),
  };
}

describe("studyPlanStatus", () => {
  const dates = ["2026-09-01", "2026-09-02", "2026-09-03"];

  it("is active while plan days remain today or later", () => {
    expect(studyPlanStatus(plan(dates, []), "2026-09-03")).toBe("active");
  });

  it("is expired, not complete, when the dates passed with days left undone", () => {
    expect(studyPlanStatus(plan(dates, ["2026-09-01"]), "2026-09-10")).toBe("expired");
  });

  it("is expired when the dates passed with nothing done", () => {
    expect(studyPlanStatus(plan(dates, []), "2026-09-10")).toBe("expired");
  });

  it("is complete once every day is done, even before the last date", () => {
    expect(studyPlanStatus(plan(dates, dates), "2026-09-02")).toBe("complete");
  });

  it("ignores done dates that are not part of the plan", () => {
    expect(
      studyPlanStatus(plan(dates, ["2026-08-01", "2026-08-02", "2026-08-03"]), "2026-09-10"),
    ).toBe("expired");
  });
});
