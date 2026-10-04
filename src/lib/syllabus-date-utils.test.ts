import { describe, expect, it } from "vitest";
import {
  extractWeekNumber,
  parseAbsoluteDate,
  parseWeekField,
  resolveMilestoneDate,
} from "./syllabus-date-utils";

// A Wednesday — week 1 therefore starts on Monday 2026-09-14.
const START = "2026-09-16";

function resolve(input: { rawDateText?: string | null; week?: string | null; weekday?: string | null }) {
  return resolveMilestoneDate({ ...input, semesterStartDate: START });
}

describe("resolveMilestoneDate — explicit dates are read day-first", () => {
  it.each([
    ["12.10", "2026-10-12"],
    ["12.10.2026", "2026-10-12"],
    ["05.11", "2026-11-05"],
    ["12/10/2026", "2026-10-12"],
    ["12-10-2026", "2026-10-12"],
    ["12/10", "2026-10-12"],
    ["2026-10-12", "2026-10-12"],
    ["12 ოქტომბერი", "2026-10-12"],
    ["12 ოქტ.", "2026-10-12"],
    ["ოქტომბრის 12", "2026-10-12"],
    ["15 მაისს 2027", "2027-05-15"],
    ["15 მაისი", "2027-05-15"],
    ["3 ნოემბერს", "2026-11-03"],
    ["2026 წლის 12 ოქტომბერი", "2026-10-12"],
    ["Oct 12", "2026-10-12"],
    ["12 October", "2026-10-12"],
    ["20.01", "2027-01-20"],
  ])("%s → %s", (rawDateText, expected) => {
    expect(resolve({ rawDateText })).toEqual({
      date: expected,
      dateStatus: "exact",
      weekNumber: null,
    });
  });

  it("rejects impossible calendar days instead of rolling them over", () => {
    expect(parseAbsoluteDate("31.02", START)).toBeNull();
  });

  it("doesn't mistake points for a date", () => {
    expect(parseAbsoluteDate("2.5 ქულა", START)).toBeNull();
  });
});

describe("resolveMilestoneDate — week numbers", () => {
  it("week 1 is the Monday of the week the semester starts in", () => {
    expect(resolve({ week: "1" })).toEqual({
      date: "2026-09-14",
      dateStatus: "computed-from-week",
      weekNumber: 1,
    });
  });

  it("reads roman week numbers", () => {
    expect(resolve({ week: "VII" }).date).toBe("2026-10-26");
  });

  it("adds the stated weekday", () => {
    expect(resolve({ rawDateText: "მე-6 კვირა, ხუთშაბათი" })).toEqual({
      date: "2026-10-22",
      dateStatus: "computed-from-week",
      weekNumber: 6,
    });
    expect(resolve({ week: "6", weekday: "ხუთშაბათს" }).date).toBe("2026-10-22");
    expect(resolve({ week: "6", weekday: "კვირა" }).date).toBe("2026-10-25");
  });

  it("takes the week number, not the quiz number", () => {
    expect(extractWeekNumber("ქვიზი 3, მე-7 კვირა")).toBe(7);
    expect(resolve({ rawDateText: "ქვიზი 3, მე-7 კვირა" }).weekNumber).toBe(7);
  });

  it("ignores numbers that aren't next to a week keyword", () => {
    expect(extractWeekNumber("ქვიზი 3")).toBeNull();
    expect(extractWeekNumber("Quiz 3")).toBeNull();
  });

  it.each([
    ["7-ე კვირა", 7],
    ["1-ლი კვირა", 1],
    ["კვირა VIII", 8],
    ["VII კვირა", 7],
    ["Week 8", 8],
    ["კვირა: 12", 12],
  ])("extracts %s → %i", (text, expected) => {
    expect(extractWeekNumber(text)).toBe(expected);
  });

  it("reads the dedicated week field in its bare forms", () => {
    expect(parseWeekField("7")).toBe(7);
    expect(parseWeekField("მე-7")).toBe(7);
    expect(parseWeekField("XII")).toBe(12);
    expect(parseWeekField("ფინალური")).toBeNull();
  });
});

describe("resolveMilestoneDate — nothing to go on", () => {
  it("returns null instead of inventing a date", () => {
    expect(resolve({ rawDateText: "ქვიზი" })).toEqual({
      date: null,
      dateStatus: "unknown",
      weekNumber: null,
    });
    expect(resolve({ rawDateText: null, week: null })).toEqual({
      date: null,
      dateStatus: "unknown",
      weekNumber: null,
    });
  });

  it("a week without a semester start stays unknown", () => {
    expect(resolveMilestoneDate({ week: "5" })).toEqual({
      date: null,
      dateStatus: "unknown",
      weekNumber: 5,
    });
  });
});
