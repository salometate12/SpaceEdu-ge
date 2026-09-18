import { describe, it, expect } from "vitest";
import {
  scoreFromSteps,
  normalizeMathOpenReport,
  type MathOpenGraderResponse,
} from "./math-open-problem-grader-schema";
import type { MathOpenStep, MathScoringRow } from "@/data/mathExamsData";

// Problem 38's real scheme: 1 ქულა → ა; 2 ქულა → ბ; 3 ქულა → ბ,გ.
const steps: MathOpenStep[] = [
  { id: "ა", description: "x₁=3 ან x₂=27" },
  { id: "ბ", description: "სისტემა / k" },
  { id: "გ", description: "პასუხი" },
];
const table: MathScoringRow[] = [
  { score: 1, requiresSteps: ["ა"] },
  { score: 2, requiresSteps: ["ბ"] },
  { score: 3, requiresSteps: ["ბ", "გ"] },
];

describe("scoreFromSteps", () => {
  it("reads the highest satisfied row off the scoring table", () => {
    expect(scoreFromSteps(new Set(["ა"]), table, 3)).toBe(1);
    expect(scoreFromSteps(new Set(["ბ"]), table, 3)).toBe(2);
    expect(scoreFromSteps(new Set(["ბ", "გ"]), table, 3)).toBe(3);
    expect(scoreFromSteps(new Set(["გ"]), table, 3)).toBe(0); // გ alone earns nothing
    expect(scoreFromSteps(new Set(), table, 3)).toBe(0);
  });

  it("never exceeds maxPoints", () => {
    const greedy: MathScoringRow[] = [{ score: 99, requiresSteps: [] }];
    expect(scoreFromSteps(new Set(), greedy, 4)).toBe(4);
  });
});

describe("normalizeMathOpenReport", () => {
  it("derives the score from steps, ignoring a wrong reported score", () => {
    const report: MathOpenGraderResponse = {
      score: 3, // model over-claims
      summary: "s",
      steps: [
        { id: "ა", done: true },
        { id: "ბ", done: false },
        { id: "გ", done: false },
      ],
    };
    const out = normalizeMathOpenReport(report, { steps, scoringTable: table, maxPoints: 3 });
    expect(out.score).toBe(1);
    expect(out.steps).toHaveLength(3);
  });

  it("fills a step the model omitted as not-done", () => {
    const report: MathOpenGraderResponse = {
      score: 0,
      summary: "s",
      steps: [{ id: "ბ", done: true }], // only reports ბ
    };
    const out = normalizeMathOpenReport(report, { steps, scoringTable: table, maxPoints: 3 });
    expect(out.steps.map((s) => s.id)).toEqual(["ა", "ბ", "გ"]);
    expect(out.score).toBe(2); // ბ done → 2
  });
});
