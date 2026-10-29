import { describe, expect, it } from "vitest";
import { generationPercent, generationStep } from "./generation-progress";

describe("generation progress", () => {
  it("moves through the steps with the cards", () => {
    expect(generationStep({ ready: 0, total: 20, elapsed: 1 })).toBe(0);
    expect(generationStep({ ready: 0, total: 20, elapsed: 30 })).toBe(1);
    expect(generationStep({ ready: 5, total: 20, elapsed: 30 })).toBe(2);
    expect(generationStep({ ready: 20, total: 20, elapsed: 30 })).toBe(3);
  });
  it("never shows more than 95% before the answer is in", () => {
    expect(generationPercent({ ready: 20, total: 20, elapsed: 30 })).toBe(95);
    expect(generationPercent({ ready: 10, total: 20, elapsed: 30 })).toBe(58);
    expect(generationPercent({ ready: 0, total: 20, elapsed: 100 })).toBe(18);
    expect(generationPercent({ ready: 0, total: 0, elapsed: 10_000 })).toBe(95);
  });
  it("lets time drive the summary", () => {
    expect(generationStep({ ready: 0, total: 0, elapsed: 20 })).toBe(2);
    expect(generationPercent({ ready: 0, total: 0, elapsed: 30 })).toBeGreaterThan(50);
  });
});
