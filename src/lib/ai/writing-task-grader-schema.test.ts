import { describe, it, expect } from "vitest";
import {
  normalizeWritingTaskReport,
  writingTaskMaxes,
  WRITING_TASK_CRITERION_IDS,
  WRITING_TASK_TOTAL_MAX,
  type WritingTaskGraderResponse,
} from "./writing-task-grader-schema";

function fullReport(scoreFor: (id: string) => number): WritingTaskGraderResponse {
  return {
    totalScore: 0,
    summary: "s",
    criteria: WRITING_TASK_CRITERION_IDS.map((id) => ({ id, score: scoreFor(id), comment: "c" })),
    strengths: [],
    corrections: [],
  };
}

describe("normalizeWritingTaskReport", () => {
  it("sums to 34 when every criterion is at its year maximum", () => {
    for (const year of [2022, 2023, 2024, 2025]) {
      const maxes = writingTaskMaxes(year);
      const report = fullReport((id) => maxes[id as keyof typeof maxes]);
      const out = normalizeWritingTaskReport(report, { year });
      expect(out.totalScore).toBe(WRITING_TASK_TOTAL_MAX);
      expect(out.criteria).toHaveLength(10);
    }
  });

  it("re-derives the total from the parts, ignoring a wrong totalScore", () => {
    const report = fullReport(() => 1);
    report.totalScore = 999;
    const out = normalizeWritingTaskReport(report, { year: 2025 });
    expect(out.totalScore).toBe(out.criteria.reduce((s, c) => s + c.score, 0));
    expect(out.totalScore).toBe(10);
  });

  it("clamps each criterion to that year's max", () => {
    const out = normalizeWritingTaskReport(fullReport(() => 99), { year: 2025 });
    const maxes = writingTaskMaxes(2025);
    for (const c of out.criteria) expect(c.score).toBe(maxes[c.id]);
    expect(out.totalScore).toBe(WRITING_TASK_TOTAL_MAX);
  });

  it("fills a missing criterion instead of dropping the row", () => {
    const partial: WritingTaskGraderResponse = {
      totalScore: 0,
      summary: "s",
      criteria: [{ id: "I", score: 2, comment: "c" }], // only one criterion returned
      strengths: [],
      corrections: [],
    };
    const out = normalizeWritingTaskReport(partial, { year: 2025 });
    expect(out.criteria).toHaveLength(10);
    expect(out.criteria.every((c) => WRITING_TASK_CRITERION_IDS.includes(c.id))).toBe(true);
  });

  it("awards criterion III full marks for a free topic (no bound text)", () => {
    const out = normalizeWritingTaskReport(fullReport(() => 0), {
      year: 2025,
      hasBoundText: false,
    });
    const iii = out.criteria.find((c) => c.id === "III");
    expect(iii?.score).toBe(writingTaskMaxes(2025).III); // 6
  });
});
