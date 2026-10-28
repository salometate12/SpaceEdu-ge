import { afterEach, describe, expect, it, vi } from "vitest";
import {
  abiturientExamCountdown,
  daysBetween,
  getExamCountdown,
  studentSessionCountdown,
} from "./exam-countdown";
import type { SyllabusMilestone } from "./syllabus-calendar";
import type { SavedStudyPlan } from "./study-plan-calendar";
import { EXAM_COUNTDOWN_KEY, STUDY_PLAN_KEYS, SYLLABUS_MILESTONES_KEY } from "./user-data-keys";

const TODAY = "2026-10-29";

function plan(...dates: string[]): SavedStudyPlan {
  return {
    subject: "ისტორია",
    savedAt: "2026-10-01T00:00:00.000Z",
    totalDays: dates.length,
    days: dates.map((date) => ({ date, day_name: "", topics: [], hours: 2, tasks: [], focus_level: "high" as const })),
    doneDates: [],
  };
}

function milestone(id: string, type: SyllabusMilestone["type"], date: string | null): SyllabusMilestone {
  return { id, title: id, type, date };
}

describe("daysBetween", () => {
  it("counts calendar days, across month ends and DST changes", () => {
    expect(daysBetween(TODAY, TODAY)).toBe(0);
    expect(daysBetween(TODAY, "2026-11-01")).toBe(3);
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
    expect(daysBetween(TODAY, "2026-10-26")).toBe(-3);
  });
});

describe("abiturientExamCountdown", () => {
  it("counts to the plan's last day", () => {
    expect(abiturientExamCountdown(plan("2026-10-29", "2026-11-15", "2026-12-10"), TODAY)).toEqual({
      kind: "days",
      days: 42,
      date: "2026-12-10",
    });
    expect(abiturientExamCountdown(plan(TODAY), TODAY)).toEqual({ kind: "days", days: 0, date: TODAY });
  });

  it("asks for a date when there is no plan, or the plan has no days", () => {
    expect(abiturientExamCountdown(null, TODAY)).toEqual({ kind: "missing" });
    expect(abiturientExamCountdown(plan(), TODAY)).toEqual({ kind: "missing" });
    expect(abiturientExamCountdown(plan("not a date"), TODAY)).toEqual({ kind: "missing" });
  });

  it("says the date has passed instead of counting below zero", () => {
    expect(abiturientExamCountdown(plan("2026-10-01", "2026-10-20"), TODAY)).toEqual({
      kind: "passed",
      date: "2026-10-20",
    });
  });
});

describe("studentSessionCountdown", () => {
  const syllabus = [
    milestone("quiz", "quiz", "2026-11-02"),
    milestone("deadline", "deadline", "2026-11-03"),
    milestone("final", "final", "2027-01-20"),
    milestone("midterm", "midterm", "2026-11-16"),
    milestone("old-midterm", "midterm", "2026-10-10"),
    milestone("undated-final", "final", null),
  ];

  it("counts to the nearest upcoming midterm or final, ignoring quizzes and deadlines", () => {
    expect(studentSessionCountdown(syllabus, plan("2026-11-05"), TODAY)).toEqual({
      kind: "days",
      days: 18,
      date: "2026-11-16",
    });
  });

  it("falls back to the plan's last day when the syllabus has no exam ahead", () => {
    const noExamAhead = [milestone("quiz", "quiz", "2026-11-02"), milestone("old", "final", "2026-10-01")];
    expect(studentSessionCountdown(noExamAhead, plan(TODAY, "2026-11-08"), TODAY)).toEqual({
      kind: "days",
      days: 10,
      date: "2026-11-08",
    });
  });

  it("asks for a syllabus when there is neither, or both are behind them", () => {
    expect(studentSessionCountdown([], null, TODAY)).toEqual({ kind: "missing" });
    expect(studentSessionCountdown([milestone("old", "midterm", "2026-10-10")], plan("2026-10-20"), TODAY)).toEqual({
      kind: "missing",
    });
  });
});

describe("getExamCountdown", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function withStorage(initial: Record<string, unknown>) {
    const map = new Map(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]));
    const localStorage = {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => void map.set(key, value),
      removeItem: (key: string) => void map.delete(key),
      key: (index: number) => [...map.keys()][index] ?? null,
      get length() {
        return map.size;
      },
    };
    vi.stubGlobal("window", {
      localStorage,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    });
    vi.resetModules();
    const mod = await import("./exam-countdown");
    return { map, getExamCountdown: mod.getExamCountdown };
  }

  it("is empty on the server", () => {
    expect(getExamCountdown("abiturient", TODAY)).toEqual({ kind: "missing" });
  });

  it("reads each space's own dates and ignores the old random number", async () => {
    const { map, getExamCountdown: read } = await withStorage({
      [EXAM_COUNTDOWN_KEY]: 117,
      [STUDY_PLAN_KEYS.abiturient]: plan(TODAY, "2026-11-28"),
      [SYLLABUS_MILESTONES_KEY]: [milestone("midterm", "midterm", "2026-11-05")],
    });
    expect(read("abiturient", TODAY)).toEqual({ kind: "days", days: 30, date: "2026-11-28" });
    expect(read("student", TODAY)).toEqual({ kind: "days", days: 7, date: "2026-11-05" });
    expect(map.get(EXAM_COUNTDOWN_KEY)).toBe("117");
  });

  it("never writes a placeholder when there is no date", async () => {
    const { map, getExamCountdown: read } = await withStorage({});
    expect(read("abiturient", TODAY)).toEqual({ kind: "missing" });
    expect(read("student", TODAY)).toEqual({ kind: "missing" });
    expect(map.has(EXAM_COUNTDOWN_KEY)).toBe(false);
  });
});
