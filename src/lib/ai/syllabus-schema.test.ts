import { describe, expect, it } from "vitest";
import {
  countQuizMentions,
  normalizeSyllabusMilestones,
  SyllabusAiResponseSchema,
  type SyllabusAiMilestone,
  type SyllabusAiResponse,
} from "./syllabus-schema";

const START = "2026-09-16";

function milestone(overrides: Partial<SyllabusAiMilestone>): SyllabusAiMilestone {
  return {
    title: "ქვიზი",
    type: "quiz",
    number: null,
    rawDateText: null,
    week: null,
    weekday: null,
    date: null,
    topic: null,
    points: null,
    weight: null,
    sourceText: null,
    ...overrides,
  };
}

function response(
  milestones: SyllabusAiMilestone[],
  overrides: Partial<SyllabusAiResponse> = {},
): SyllabusAiResponse {
  return {
    insight: "",
    milestones,
    expectedCounts: { quiz: null, midterm: null, final: null },
    warnings: [],
    ...overrides,
  };
}

describe("normalizeSyllabusMilestones", () => {
  it("replaces the model's wrong date with the one computed from the text", () => {
    const result = normalizeSyllabusMilestones(
      response([
        // The model read 12.10 month-first and reported 10 December.
        milestone({ title: "ქვიზი 1", number: 1, rawDateText: "12.10", date: "2026-12-10" }),
        // The model counted weeks from the Wednesday start instead of Monday.
        milestone({ title: "ქვიზი 2", number: 2, week: "7", rawDateText: "მე-7 კვირა", date: "2026-10-28" }),
      ]),
      { semesterStartDate: START },
    );

    expect(result.milestones.map((m) => [m.title, m.date, m.dateStatus])).toEqual([
      ["ქვიზი 1", "2026-10-12", "exact"],
      ["ქვიზი 2", "2026-10-26", "computed-from-week"],
    ]);
    expect(result.dateMismatches).toHaveLength(2);
    expect(result.dateMismatches[0]).toMatchObject({
      modelDate: "2026-12-10",
      computedDate: "2026-10-12",
    });
  });

  it("merges duplicates, keeping the better-dated copy and filling gaps", () => {
    const result = normalizeSyllabusMilestones(
      response([
        milestone({ title: "ქვიზი 3", number: 3, week: "7", topic: "წარმოებული" }),
        milestone({ title: "Quiz 3", number: 3, rawDateText: "26.10", points: 5 }),
        milestone({ title: "ქვიზი 3", number: 3, week: "7" }),
      ]),
      { semesterStartDate: START },
    );

    expect(result.milestones).toHaveLength(1);
    expect(result.milestones[0]).toMatchObject({
      date: "2026-10-26",
      dateStatus: "exact",
      topic: "წარმოებული",
      points: 5,
    });
  });

  it("does not merge different quizzes that share a week", () => {
    const result = normalizeSyllabusMilestones(
      response([
        milestone({ title: "ქვიზი 1", number: 1, week: "4" }),
        milestone({ title: "ქვიზი 2", number: 2, week: "4" }),
      ]),
      { semesterStartDate: START },
    );
    expect(result.milestones).toHaveLength(2);
  });

  it("keeps undated events as unknown, sorted last, with a warning", () => {
    const result = normalizeSyllabusMilestones(
      response([
        milestone({ title: "ქვიზი", date: "2026-11-01" }),
        milestone({ title: "ფინალური გამოცდა", type: "final", rawDateText: "20.01" }),
      ]),
      { semesterStartDate: START },
    );
    expect(result.milestones.map((m) => [m.type, m.date, m.dateStatus])).toEqual([
      ["final", "2027-01-20", "exact"],
      ["quiz", null, "unknown"],
    ]);
    expect(result.warnings.some((w) => w.includes("თარიღი სილაბუსში არ წერია"))).toBe(true);
  });

  it("warns when fewer quizzes were found than the grading section lists", () => {
    const result = normalizeSyllabusMilestones(
      response(
        [
          milestone({ title: "ქვიზი 1", number: 1, week: "3" }),
          milestone({ title: "ქვიზი 2", number: 2, week: "6" }),
          milestone({ title: "ქვიზი 3", number: 3, week: "9" }),
        ],
        { expectedCounts: { quiz: 4, midterm: 1, final: 1 } },
      ),
      { semesterStartDate: START },
    );
    expect(result.warnings).toContain(
      "შეფასების სისტემაში 4 ქვიზი წერია, ნაპოვნია 3. შეადარე სილაბუსს.",
    );
  });

  it("warns when the text mentions more quizzes than were returned", () => {
    const text = "ქვიზი 1 — მე-3 კვირა\nქვიზი 2 — მე-6 კვირა\nქვიზი 3 — მე-9 კვირა";
    const result = normalizeSyllabusMilestones(
      response([milestone({ title: "ქვიზი 1", number: 1, week: "3" })]),
      { semesterStartDate: START, sourceText: text },
    );
    expect(result.quizMentionsInText).toBe(3);
    expect(result.warnings.some((w) => w.startsWith("შესაძლოა ყველა ქვიზი არ იყოს ნაპოვნი"))).toBe(true);
  });

  it("gives stable, unique ids that differ between files", () => {
    const input = response([
      milestone({ title: "ქვიზი 1", number: 1, week: "3" }),
      milestone({ title: "ქვიზი 2", number: 2, week: "6" }),
    ]);
    const a = normalizeSyllabusMilestones(input, { semesterStartDate: START, fileName: "a.pdf" });
    const again = normalizeSyllabusMilestones(input, { semesterStartDate: START, fileName: "a.pdf" });
    const b = normalizeSyllabusMilestones(input, { semesterStartDate: START, fileName: "b.pdf" });
    const ids = a.milestones.map((m) => m.id);
    expect(new Set(ids).size).toBe(2);
    expect(again.milestones.map((m) => m.id)).toEqual(ids);
    expect(b.milestones.map((m) => m.id)).not.toEqual(ids);
  });
});

describe("countQuizMentions", () => {
  it.each([
    ["ქვიზი 1, ქვიზი 2, ქვიზი 3", 3],
    ["ქვიზი 4 × 5 ქულა = 20 ქულა", 4],
    ["4 ქვიზი, თითო 5 ქულა", 4],
    ["Q1 Q2 Q3 Q4 Q5", 5],
    ["ქვიზები 20%", 0],
    ["მე-7 კვირა ქვიზი", 0],
    ["Week 7 Quiz", 0],
  ])("%s → %i", (text, expected) => {
    expect(countQuizMentions(text)).toBe(expected);
  });
});

describe("SyllabusAiResponseSchema", () => {
  it("accepts an empty milestone list instead of failing validation", () => {
    expect(
      SyllabusAiResponseSchema.safeParse({
        insight: "",
        milestones: [],
        expectedCounts: { quiz: null, midterm: null, final: null },
        warnings: [],
      }).success,
    ).toBe(true);
  });

  it("accepts the final type", () => {
    expect(
      SyllabusAiResponseSchema.shape.milestones.element.shape.type.safeParse("final").success,
    ).toBe(true);
  });
});
