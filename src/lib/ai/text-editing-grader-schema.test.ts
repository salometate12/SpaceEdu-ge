import { describe, it, expect } from "vitest";
import {
  normalizeTextEditingReport,
  textEditingMaxes,
  TEXT_EDITING_CRITERION_IDS,
  TEXT_EDITING_TOTAL_MAX,
  type TextEditingGraderResponse,
} from "./text-editing-grader-schema";

function report(scoreFor: (id: string) => number): TextEditingGraderResponse {
  return {
    totalScore: 0,
    summary: "s",
    criteria: TEXT_EDITING_CRITERION_IDS.map((id) => ({ id, score: scoreFor(id), comment: "c" })),
    corrections: [],
  };
}

describe("normalizeTextEditingReport", () => {
  it("sums to 16 at full marks, for every year's split", () => {
    for (const year of [2022, 2023, 2024, 2025]) {
      const maxes = textEditingMaxes(year);
      const out = normalizeTextEditingReport(report((id) => maxes[id as keyof typeof maxes]), year);
      expect(out.totalScore).toBe(TEXT_EDITING_TOTAL_MAX);
    }
  });

  it("uses the 2022 split (9/2/5) and the 2025 split (8/2/6)", () => {
    expect(textEditingMaxes(2022)).toEqual({ I: 9, II: 2, III: 5 });
    expect(textEditingMaxes(2025)).toEqual({ I: 8, II: 2, III: 6 });
  });

  it("re-derives the total from the parts", () => {
    const r = report(() => 1);
    r.totalScore = 500;
    const out = normalizeTextEditingReport(r, 2025);
    expect(out.totalScore).toBe(3);
  });

  it("treats a missing criterion as full marks (no invented deduction)", () => {
    const partial: TextEditingGraderResponse = {
      totalScore: 0,
      summary: "s",
      criteria: [{ id: "III", score: 4, comment: "c" }],
      corrections: [],
    };
    const out = normalizeTextEditingReport(partial, 2025);
    const maxes = textEditingMaxes(2025);
    expect(out.criteria.find((c) => c.id === "I")?.score).toBe(maxes.I); // 8, untouched → full
    expect(out.criteria.find((c) => c.id === "III")?.score).toBe(4);
    expect(out.criteria).toHaveLength(3);
  });

  it("clamps a criterion above its max", () => {
    const out = normalizeTextEditingReport(report(() => 99), 2025);
    expect(out.totalScore).toBe(TEXT_EDITING_TOTAL_MAX);
  });
});
