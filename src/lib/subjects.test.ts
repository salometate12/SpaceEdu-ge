import { describe, expect, it } from "vitest";
import {
  cleanFileTitle,
  cleanTopicIds,
  fileTitle,
  fileProblem,
  guessKindFromName,
  nextExam,
  statusAfterQuiz,
  subjectBytes,
  subjectStorageLimitBytes,
  SUBJECT_FILE_TOO_BIG,
  SUBJECT_STORAGE_FULL,
  replaceSyllabusTopicsPlan,
  syllabusTopicsToAdd,
  type SubjectFile,
  type SubjectTopic,
} from "./subjects";
import type { SyllabusMilestone } from "./syllabus-calendar";

const MB = 1024 * 1024;
const subject = { id: "s1", name: "მიკროეკონომიკა" };
const milestone = (extra: Partial<SyllabusMilestone>): SyllabusMilestone => ({ id: `m-${Math.random()}`, title: "კვირა", date: null, type: "deadline", subject: "მიკროეკონომიკა", ...extra });
const topic = (title: string, order: number, extra: Partial<SubjectTopic> = {}): SubjectTopic => ({
  id: `t-${order}`,
  subjectId: "s1",
  order,
  title,
  source: "manual",
  status: "new",
  createdAt: 0,
  updatedAt: 0,
  ...extra,
});
const file = (size: number, extra: Partial<SubjectFile> = {}): SubjectFile => ({
  id: `f-${size}`,
  subjectId: "s1",
  name: "a.pdf",
  size,
  mime: "application/pdf",
  kind: "lecture",
  topicIds: [],
  storagePath: null,
  createdAt: 0,
  updatedAt: 0,
  ...extra,
});

describe("subject topics from the syllabus", () => {
  it("adds the syllabus's topics it doesn't have, in order, after the existing ones", () => {
    const fresh = syllabusTopicsToAdd([topic("ბაზრის  წონასწორობა.", 1)], ["ელასტიურობა", "ბაზრის წონასწორობა", "ელასტიურობა"], subject, 5);
    expect(fresh.map((item) => [item.title, item.order, item.source, item.status])).toEqual([["ელასტიურობა", 2, "syllabus", "new"]]);
  });

  it("taking the topics again: same titles stay with their progress, old ones go, hand-added stay last", () => {
    const existing = [
      topic("I-VII კვირის მასალა", 1, { source: "syllabus", id: "scope" }),
      topic("ელასტიურობა", 2, { source: "syllabus", id: "el", status: "done" }),
      topic("ჩემი თემა", 3, { id: "mine" }),
      topic("სხვა საგანი", 1, { source: "syllabus", id: "other", subjectId: "s2" }),
    ];
    const plan = replaceSyllabusTopicsPlan(existing, ["მოთხოვნა და მიწოდება", "ელასტიურობა"], "s1", 9);
    expect(plan.remove).toEqual(["scope"]);
    expect(plan.add.map((item) => [item.title, item.order])).toEqual([["მოთხოვნა და მიწოდება", 1]]);
    expect(plan.update.map((item) => [item.id, item.order, item.status])).toEqual([
      ["el", 2, "done"],
      ["mine", 3, "new"],
    ]);
  });

  it("finds the next exam of this subject, not a past one or another subject's", () => {
    const milestones = [
      milestone({ type: "midterm", date: "2026-10-01" }),
      milestone({ type: "final", date: "2026-12-20" }),
      milestone({ type: "midterm", date: "2026-11-14" }),
      milestone({ type: "deadline", date: "2026-11-02" }),
      milestone({ type: "quiz", date: "2026-11-05", subject: "სტატისტიკა" }),
    ];
    expect(nextExam(milestones, "მიკროეკონომიკა", "2026-10-31")).toMatchObject({ label: "შუალედური", date: "2026-11-14", days: 14 });
    expect(nextExam([], "მიკროეკონომიკა", "2026-10-31")).toBeNull();
  });
});

describe("subject files", () => {
  it("refuses a file over 20 MB and anything past the subject's limit", () => {
    expect(subjectStorageLimitBytes(undefined)).toBe(200 * MB);
    expect(subjectStorageLimitBytes("50")).toBe(50 * MB);
    expect(fileProblem(21 * MB, 0)).toBe(SUBJECT_FILE_TOO_BIG);
    expect(fileProblem(5 * MB, 196 * MB)).toBe(SUBJECT_STORAGE_FULL);
    expect(fileProblem(5 * MB, 190 * MB)).toBeNull();
    expect(subjectBytes([file(3 * MB), file(2 * MB, { subjectId: "s2" }), file(1 * MB, { deletedAt: 1 })], "s1")).toBe(3 * MB);
  });

  it("guesses a kind from the name until the AI answers, and keeps only the subject's own topics", () => {
    expect(guessKindFromName("ლექცია 3.pdf")).toBe("lecture");
    expect(guessKindFromName("Homework 2.docx")).toBe("assignment");
    expect(guessKindFromName("slides.pptx")).toBe("presentation");
    expect(guessKindFromName("chapter 4.pdf")).toBe("reading");
    expect(guessKindFromName("scan.jpg")).toBe("other");
    expect(cleanTopicIds(["t-1", "x", "t-2", "t-3", "t-1"], [{ id: "t-1" }, { id: "t-2" }, { id: "t-3" }])).toEqual(["t-1", "t-2"]);
    expect(cleanTopicIds("t-1", [{ id: "t-1" }])).toEqual([]);
  });

  it("a quiz of 80% or more marks the topic learned; less keeps it under way", () => {
    expect(statusAfterQuiz("new", 85)).toBe("done");
    expect(statusAfterQuiz("new", 60)).toBe("in_progress");
    expect(statusAfterQuiz("done", 40)).toBe("done");
  });
});

describe("a file's title from its contents", () => {
  it("the list shows the title, else the file's name", () => {
    expect(fileTitle({ name: "72975.pptx", displayTitle: "ლექცია 2: პროცესები" })).toBe("ლექცია 2: პროცესები");
    expect(fileTitle({ name: "72975.pptx", displayTitle: "  " })).toBe("72975.pptx");
  });

  it("a model's title: one line, no quotes or dashes, at most 80 characters", () => {
    expect(cleanFileTitle(' „ლექცია 2 - პროცესები“. ')).toBe("ლექცია 2: პროცესები");
    expect(cleanFileTitle("x")).toBeNull();
    expect(cleanFileTitle(null)).toBeNull();
    expect(cleanFileTitle("ა".repeat(100))).toHaveLength(80);
  });
});

