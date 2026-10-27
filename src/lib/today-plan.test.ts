import { describe, expect, it } from "vitest";
import { planLine, studyPlanHref } from "./today-plan";

describe("planLine", () => {
  it("joins the topics and adds the hours", () => {
    expect(planLine({ topics: ["ელასტიურობა", "ბაზრები"], hours: 2 })).toBe("ელასტიურობა, ბაზრები · 2 საათი");
    expect(planLine({ topics: ["გრაფები"], hours: 2.5 })).toBe("გრაფები · 2.5 საათი");
  });

  it("falls back to the subject, and drops missing hours", () => {
    expect(planLine({ topics: [" "], hours: 0 }, "მიკროეკონომიკა")).toBe("მიკროეკონომიკა");
    expect(planLine({ topics: [], hours: 1 })).toBe("სასწავლო გეგმა · 1 საათი");
  });
});

describe("studyPlanHref", () => {
  it("opens today's day for students and the abiturient plan page otherwise", () => {
    expect(studyPlanHref("student", "2026-10-27")).toBe("/study-plan?day=2026-10-27");
    expect(studyPlanHref("student")).toBe("/study-plan");
    expect(studyPlanHref("abiturient", "2026-10-27")).toBe("/study-plan/abit");
  });
});
