import { describe, expect, it } from "vitest";
import type { SyllabusMilestone } from "./syllabus-calendar";
import {
  bindUnbound,
  daysFrom,
  groupByMonth,
  matchSemesterSubject,
  milestonesForSubject,
  normalizeSyllabusDate,
  parseWeek,
  replaceSubjectMilestones,
  savedSyllabi,
  semesterRangeLabel,
  syllabusCounts,
  weekPlan,
  sortSyllabusDates,
  syllabusTopics,
  unboundMilestones,
  weekToDate,
} from "./syllabus-dates";

const m = (over: Partial<SyllabusMilestone>): SyllabusMilestone => ({
  id: over.id ?? Math.random().toString(36).slice(2),
  title: "ქვიზი",
  date: null,
  type: "quiz",
  ...over,
});

describe("syllabus dates: one format", () => {
  it("labels a real date", () => {
    expect(normalizeSyllabusDate(m({ date: "2026-11-16" }))).toMatchObject({ date: "2026-11-16", week: null, label: "16 ნოე" });
  });

  it("turns a week into its Monday when the semester start is known", () => {
    // 2026-09-16 is a Wednesday: week 1 starts Monday 14 Sep, week 4 on 5 Oct.
    expect(weekToDate(1, "2026-09-16")).toBe("2026-09-14");
    expect(weekToDate(4, "2026-09-16")).toBe("2026-10-05");
    expect(normalizeSyllabusDate(m({ week: "4" }), "2026-09-16")).toMatchObject({ date: "2026-10-05", label: "5 ოქტ" });
    expect(normalizeSyllabusDate(m({ week: "4", semesterStart: "2026-09-16" }))).toMatchObject({ date: "2026-10-05" });
  });

  it("keeps only the week when the start is unknown", () => {
    expect(normalizeSyllabusDate(m({ week: "მე-4" }))).toMatchObject({ date: null, week: 4, label: "მე-4 კვ." });
  });

  it("reads week ranges and Roman numerals as the first week", () => {
    expect(parseWeek("მე-18/მე-19")).toBe(18);
    expect(parseWeek("18–19")).toBe(18);
    expect(parseWeek("VIII")).toBe(8);
    expect(parseWeek("XIV")).toBe(14);
    expect(parseWeek(null)).toBeNull();
  });
});

describe("syllabus dates: what's ahead, in order", () => {
  const items = [
    normalizeSyllabusDate(m({ id: "late", date: "2026-12-20" })),
    normalizeSyllabusDate(m({ id: "gone", date: "2026-09-30" })),
    normalizeSyllabusDate(m({ id: "today", date: "2026-10-23" })),
    normalizeSyllabusDate(m({ id: "soon", date: "2026-11-02" })),
    normalizeSyllabusDate(m({ id: "week", week: "9" })),
  ];
  const sorted = sortSyllabusDates(items, "2026-10-23");

  it("keeps today and later, nearest first; hides the past", () => {
    expect(sorted.upcoming.map((item) => item.id)).toEqual(["today", "soon", "late"]);
    expect(sorted.past.map((item) => item.id)).toEqual(["gone"]);
    expect(sorted.undated.map((item) => item.id)).toEqual(["week"]);
  });

  it("groups by month and counts days", () => {
    expect(groupByMonth(sorted.upcoming).map((group) => group.month)).toEqual(["ოქტომბერი 2026", "ნოემბერი 2026", "დეკემბერი 2026"]);
    expect(daysFrom("2026-10-23", "2026-11-02")).toBe(10);
  });
});

describe("syllabus: which subject", () => {
  const subjects = ["მიკროეკონომიკა", "სტატისტიკა", "მონაცემთა სტრუქტურები"];

  it("matches the course name to a semester subject", () => {
    expect(matchSemesterSubject("მიკროეკონომიკა", subjects)).toBe("მიკროეკონომიკა");
    expect(matchSemesterSubject("მიკროეკონომიკა I (ECON 101)", subjects)).toBe("მიკროეკონომიკა");
    expect(matchSemesterSubject("„სტატისტიკა“", subjects)).toBe("სტატისტიკა");
    expect(matchSemesterSubject("ფიზიკა", subjects)).toBeNull();
    expect(matchSemesterSubject(null, subjects)).toBeNull();
  });

  it("shows a subject only its own syllabus; unbound ones belong to none", () => {
    const stored = [m({ id: "a", subject: "სტატისტიკა" }), m({ id: "b" }), m({ id: "c", subject: "მიკროეკონომიკა" })];
    expect(milestonesForSubject(stored, "სტატისტიკა").map((item) => item.id)).toEqual(["a"]);
    expect(unboundMilestones(stored).map((item) => item.id)).toEqual(["b"]);
    expect(milestonesForSubject(bindUnbound(stored, "სტატისტიკა"), "სტატისტიკა").map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("a new analysis replaces the same subject's syllabus only", () => {
    const stored = [m({ id: "old", subject: "სტატისტიკა" }), m({ id: "other", subject: "მიკროეკონომიკა" })];
    const next = replaceSubjectMilestones(stored, "სტატისტიკა", [m({ id: "new" })]);
    expect(next.map((item) => [item.id, item.subject])).toEqual([
      ["other", "მიკროეკონომიკა"],
      ["new", "სტატისტიკა"],
    ]);
  });

  it("a new analysis keeps the task helper's due dates", () => {
    const stored = [m({ id: "old", subject: "სტატისტიკა" }), m({ id: "task-abc-due", subject: "სტატისტიკა" }), m({ id: "task-xyz-due" })];
    expect(replaceSubjectMilestones(stored, "სტატისტიკა", [m({ id: "new" })]).map((item) => item.id)).toEqual(["task-abc-due", "task-xyz-due", "new"]);
    expect(replaceSubjectMilestones(stored, null, []).map((item) => item.id)).toEqual(["old", "task-abc-due", "task-xyz-due"]);
  });

  it("collects the syllabus topics once each", () => {
    expect(syllabusTopics([m({ topic: "ელასტიურობა" }), m({ topic: " ელასტიურობა " }), m({ topic: "ბაზრის წონასწორობა" }), m({})])).toEqual([
      "ელასტიურობა",
      "ბაზრის წონასწორობა",
    ]);
  });
});

describe("syllabus analyzer views", () => {
  const ms = [
    m({ id: "q", week: "2", topic: "მოთხოვნა", subject: "მიკრო", semesterStart: "2026-09-14" }),
    m({ id: "mid", type: "midterm", date: "2026-11-02", subject: "მიკრო", semesterStart: "2026-09-14", weight: 30 }),
    m({ id: "fin", type: "final", date: "2027-01-25", subject: "მიკრო", semesterStart: "2026-09-14" }),
    m({ id: "due", type: "deadline", date: "2026-10-20", subject: "სტატ" }),
    m({ id: "old", date: "2026-10-30" }),
  ];

  it("counts the kinds", () => {
    expect(syllabusCounts(ms)).toEqual({ total: 5, exams: 2, quizzes: 2, deadlines: 1 });
  });

  it("lays out the weeks from the week or the date", () => {
    const weeks = weekPlan(ms.filter((item) => item.subject === "მიკრო"));
    expect(weeks.map((row) => [row.week, row.monday, row.items.map((item) => item.id)])).toEqual([
      [2, "2026-09-21", ["q"]],
      [8, "2026-11-02", ["mid"]],
      [20, "2027-01-25", ["fin"]],
    ]);
  });

  it("lists saved syllabi by subject with the next date; unbound last", () => {
    expect(savedSyllabi(ms, "2026-10-26").map((row) => [row.subject, row.count, row.next?.id ?? null])).toEqual([
      ["მიკრო", 3, "mid"],
      ["სტატ", 1, null],
      [null, 1, "old"],
    ]);
  });

  it("labels the semester's span and keeps the weight", () => {
    expect(semesterRangeLabel(ms.filter((item) => item.subject === "მიკრო"))).toBe("14 სექ 2026 — 25 იან 2027");
    expect(normalizeSyllabusDate(ms[1]).weight).toBe(30);
  });
});
