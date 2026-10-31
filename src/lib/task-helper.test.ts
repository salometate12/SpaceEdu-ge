import { describe, expect, it } from "vitest";
import { daysUntil, finishTaskResult, isIsoDate, parseSections, parseTaskType, spreadStepDates } from "./task-helper";
import { buildTaskHelperSchema } from "./ai/task-helper-schema";

describe("task helper dates", () => {
  it("spreads the steps from today to the day before the due date", () => {
    expect(spreadStepDates(4, "2026-11-01", "2026-11-11")).toEqual(["2026-11-01", "2026-11-04", "2026-11-07", "2026-11-10"]);
    expect(spreadStepDates(1, "2026-11-01", "2026-11-11")).toEqual(["2026-11-10"]);
  });

  it("crosses months and puts several steps on one day when time is short", () => {
    expect(spreadStepDates(3, "2026-11-29", "2026-12-03")).toEqual(["2026-11-29", "2026-12-01", "2026-12-02"]);
    expect(spreadStepDates(5, "2026-11-01", "2026-11-03")).toEqual(["2026-11-01", "2026-11-01", "2026-11-02", "2026-11-02", "2026-11-02"]);
  });

  it("due today or past: every step today", () => {
    expect(spreadStepDates(3, "2026-11-05", "2026-11-05")).toEqual(["2026-11-05", "2026-11-05", "2026-11-05"]);
    expect(spreadStepDates(2, "2026-11-05", "2026-11-01")).toEqual(["2026-11-05", "2026-11-05"]);
  });

  it("days left and date checks", () => {
    expect(daysUntil("2026-11-11", "2026-11-01")).toBe(10);
    expect(daysUntil("2026-10-30", "2026-11-01")).toBe(-2);
    expect(isIsoDate("2026-11-01")).toBe(true);
    expect(isIsoDate("1.11.2026")).toBe(false);
  });
});

describe("task helper input and answer", () => {
  it("keeps only known sections, the default three when none", () => {
    expect(parseSections(["ideas", "presentation", "nope"])).toEqual(["ideas", "presentation"]);
    expect(parseSections([])).toEqual(["steps", "ideas", "tips"]);
    expect(parseTaskType("code")).toBe("code");
    expect(parseTaskType("x")).toBe("other");
  });

  it("asks the model only for the sections picked", () => {
    const keys = (sections: Parameters<typeof buildTaskHelperSchema>[0]) => Object.keys(buildTaskHelperSchema(sections).shape).sort();
    expect(keys(["steps", "ideas", "tips"])).toEqual(["followUp", "grading", "ideas", "requirements", "steps", "tips", "title"]);
    expect(keys(["presentation"])).toEqual(["followUp", "grading", "presentation", "requirements", "title"]);
  });

  it("trims the answer to the agreed sizes, drops unasked sections and dates the steps on the server", () => {
    const answer = {
      title: "  პოსტერი:  ეკოლოგია ქალაქში ",
      requirements: Array.from({ length: 10 }, (_, i) => `მოთხოვნა ${i + 1}`),
      steps: Array.from({ length: 9 }, (_, i) => ({ title: `ნაბიჯი ${i + 1}`, detail: "დეტალი" })),
      ideas: Array.from({ length: 4 }, (_, i) => ({ title: `იდეა ${i + 1}`, description: "აღწერა", tags: ["ა", "ბ"] })),
      tips: Array.from({ length: 6 }, (_, i) => ({ label: `რჩევა ${i + 1}`, text: "ტექსტი" })),
      presentation: { slides: [{ title: "შესავალი", minutes: 1, say: "გამარჯობა" }] },
      followUp: { question: "რომელი იდეა?", options: ["პირველი", "მეორე", "მესამე", "მეოთხე"] },
    };
    const result = finishTaskResult(answer, ["steps", "ideas", "tips"], { today: "2026-11-01", due: "2026-11-15" });
    expect(result.title).toBe("პოსტერი: ეკოლოგია ქალაქში");
    expect(result.requirements).toHaveLength(8);
    expect(result.steps).toHaveLength(8);
    expect(result.steps?.[0].date).toBe("2026-11-01");
    expect(result.steps?.[7].date).toBe("2026-11-14");
    expect(result.ideas).toHaveLength(3);
    expect(result.tips).toHaveLength(5);
    expect(result.presentation).toBeUndefined();
    expect(result.grading).toBeUndefined();
    expect(result.followUp.options).toHaveLength(3);
    // No due date: no dates.
    expect(finishTaskResult(answer, ["steps"], { today: "2026-11-01" }).steps?.[0].date).toBeUndefined();
  });
});
