import { describe, expect, it } from "vitest";
import type { ActivityEvent, ActivityType, StatsSpace } from "@/lib/activity-log";
import { legacyEvents, toolKey } from "@/lib/activity-log";
import { activityHeatmap, bestStreak, heatLevel, rangeDays, rangeStart } from "./common";
import { getStudentStats, subjectProgress } from "./student";
import { daysToExam, essayStats, getAbiturientStats, subjectReadiness } from "./abiturient";
import { computeBadges } from "./badges";

const NOW = new Date(2026, 9, 28, 18, 0); // Wed 28 Oct 2026
let n = 0;
function ev(
  space: StatsSpace,
  type: ActivityType,
  daysAgo: number,
  extra: Partial<ActivityEvent> = {},
): ActivityEvent {
  const at = new Date(NOW);
  at.setDate(at.getDate() - daysAgo);
  at.setHours(12, 0, 0, 0);
  n += 1;
  return { id: `e${n}`, space, type, tool: null, subject: null, value: null, meta: null, createdAt: at.getTime(), ...extra };
}

describe("ranges", () => {
  it("counts today in a 7-day period", () => {
    expect(rangeDays("7d", NOW)).toBe(7);
    expect(rangeDays("30d", NOW)).toBe(30);
  });
  it("starts the autumn semester on 1 September and the spring one on 1 February", () => {
    expect(new Date(rangeStart("semester", NOW)).getMonth()).toBe(8);
    expect(new Date(rangeStart("semester", new Date(2027, 2, 10))).getMonth()).toBe(1);
    expect(new Date(rangeStart("semester", new Date(2027, 0, 10))).getFullYear()).toBe(2026);
  });
});

describe("heatmap and streaks", () => {
  it("puts today in the last column and leaves later days empty", () => {
    const map = activityHeatmap([ev("student", "tool_open", 0), ev("student", "tool_open", 0)], 12, NOW);
    expect(map).toHaveLength(12);
    const last = map[11];
    expect(last[2]).toMatchObject({ date: "2026-10-28", count: 2, level: 1, future: false });
    expect(last[3].future).toBe(true);
  });
  it("steps the levels", () => {
    expect([0, 1, 3, 6, 12].map(heatLevel)).toEqual([0, 1, 2, 3, 4]);
  });
  it("finds the longest run of days", () => {
    expect(bestStreak([0, 1, 2, 5, 6].map((d) => ev("student", "tool_open", d)))).toBe(3);
  });
});

describe("getStudentStats", () => {
  const log = [
    ev("student", "quiz_completed", 1, { value: 80, subject: "ალგორითმები", tool: "quiz" }),
    ev("student", "quiz_completed", 2, { value: 60, subject: "ალგორითმები", tool: "quiz" }),
    ev("student", "ai_session", 0, { tool: "ai_teacher" }),
    ev("student", "ai_session", 10, { tool: "ai_teacher" }),
    ev("student", "plan_day_done", 0, { meta: { hours: 2 }, subject: "ალგორითმები" }),
    ev("student", "tool_open", 0, { tool: "presentation" }),
    // Another space's events never show up.
    ev("abiturient", "quiz_completed", 0, { value: 100, subject: "ბიოლოგია" }),
    ev("abiturient", "mock_exam_completed", 0, { value: 70 }),
  ];
  const stats = getStudentStats(log, ["ალგორითმები", "სტატისტიკა"], "7d", NOW);

  it("counts only the student's events in the period", () => {
    expect(stats.quizzes).toBe(2);
    expect(stats.quizAverage).toBe(70);
    expect(stats.activeDays).toBe(3);
    expect(stats.aiSessions).toBe(1);
    expect(stats.aiSessionsPrevious).toBe(1);
    expect(stats.studyHours).toBe(2);
  });
  it("lists only the student's own subjects", () => {
    expect(stats.subjects.map((s) => s.name)).toEqual(["ალგორითმები", "სტატისტიკა"]);
    expect(stats.subjects[1]).toMatchObject({ progress: 0, quizzes: 0 });
  });
  it("counts tools by opens and sessions", () => {
    expect(stats.tools.map((t) => t.tool)).toEqual(["ai_teacher", "presentation"]);
  });
});

describe("subjectProgress", () => {
  it("weighs plan days and quizzes, capped at 100", () => {
    expect(subjectProgress(0, 0, null)).toBe(0);
    expect(subjectProgress(1, 0, null)).toBe(10);
    expect(subjectProgress(0, 3, 100)).toBe(40);
    expect(subjectProgress(0, 1, 90)).toBe(12);
    expect(subjectProgress(10, 5, 100)).toBe(100);
  });
});

describe("getAbiturientStats", () => {
  const log = [
    ev("abiturient", "mock_exam_completed", 5, { value: 50, subject: "ისტორია" }),
    ev("abiturient", "mock_exam_completed", 2, { value: 70, subject: "ქართული" }),
    ev("abiturient", "past_test_solved", 1, { subject: "ისტორია", meta: { tasks: 12 } }),
    ev("abiturient", "essay_graded", 1, {
      value: 8,
      meta: { max: 10, criteria: { argumentation: { score: 4, max: 5 }, structure: { score: 3, max: 5 } } },
    }),
    ev("student", "mock_exam_completed", 0, { value: 99, subject: "ისტორია" }),
  ];
  const stats = getAbiturientStats(log, ["ისტორია", "ქართული", "მათემატიკა"], "30d", "2027-06-20", NOW);

  it("reads simulations of the abiturient space only", () => {
    expect(stats.mockCount).toBe(2);
    expect(stats.lastMock).toMatchObject({ subject: "ქართული", score: 70 });
    expect(stats.averageScore).toBe(60);
    expect(stats.averageDelta).toBe(10);
    expect(stats.solvedTasks).toBe(12);
  });
  it("gives readiness for the exam subjects asked for", () => {
    expect(stats.readiness.map((r) => r.name)).toEqual(["ისტორია", "ქართული", "მათემატიკა"]);
    expect(stats.readiness[2].readiness).toBe(0);
  });
  it("averages essay criteria out of ten", () => {
    expect(stats.essay.average).toBe(8);
    expect(stats.essay.criteria).toEqual({ argumentation: 8, structure: 6, style: null });
  });
  it("counts days to the exam", () => {
    expect(daysToExam("2026-10-30", NOW)).toBe(2);
    expect(daysToExam(null, NOW)).toBeNull();
  });
  it("trusts simulations more as they add up", () => {
    expect(subjectReadiness([], 5)).toBe(5);
    expect(subjectReadiness([90], 0)).toBe(30);
    expect(subjectReadiness([90, 90, 90], 0)).toBe(90);
  });
  it("is empty with no grades", () => {
    expect(essayStats([])).toEqual({ count: 0, average: null, criteria: { argumentation: null, structure: null, style: null } });
  });
});

describe("computeBadges", () => {
  it("earns badges from the space's own log only", () => {
    const log = [
      ev("student", "quiz_completed", 0, { value: 100 }),
      ev("abiturient", "mock_exam_completed", 0, { value: 80 }),
    ];
    const student = computeBadges(log, "student");
    expect(student.find((b) => b.id === "quiz_100")?.unlocked).toBe(true);
    expect(student.find((b) => b.id === "mock_exam")?.unlocked).toBe(false);
    expect(computeBadges(log, "abiturient").find((b) => b.id === "mock_exam")?.unlocked).toBe(true);
  });
  it("uses the header's streak too", () => {
    expect(computeBadges([], "student", { streakBest: 7 }).find((b) => b.id === "streak_7")?.unlocked).toBe(true);
  });
});

describe("activity log helpers", () => {
  it("names tools by one key", () => {
    expect(toolKey("ai-teacher")).toBe("ai_teacher");
    expect(toolKey("abit-history-open")).toBe("open_grader");
    expect(toolKey("study-plan")).toBe("study_plan");
    expect(toolKey("flashcards")).toBe("flashcards");
  });
  it("imports the old tool opens and quiz runs into the given space", () => {
    const events = legacyEvents(
      [{ id: "a", toolId: "quiz", toolTitle: "ქვიზი", subject: null, timestamp: 1 }],
      [{ at: 2, correct: 3, total: 4, subject: "ალგებრა" }],
      "student",
    );
    expect(events.map((e) => [e.type, e.space, e.value])).toEqual([
      ["tool_open", "student", null],
      ["quiz_completed", "student", 75],
    ]);
  });
});

describe("essayGradeEvent", () => {
  it("folds the rubric into three groups", async () => {
    const { essayGradeEvent } = await import("./abiturient");
    const { value, meta } = essayGradeEvent(
      20,
      34,
      [
        { id: "I", score: 2 },
        { id: "II", score: 1 },
        { id: "IX", score: 5 },
      ],
      { I: 2, II: 2, IV: 5, VI: 3, VIII: 3, IX: 5, X: 4 },
    );
    expect(value).toBe(20);
    expect(meta).toEqual({
      max: 34,
      criteria: { argumentation: { score: 2, max: 10 }, structure: { score: 1, max: 2 }, style: { score: 5, max: 12 } },
    });
  });
});
