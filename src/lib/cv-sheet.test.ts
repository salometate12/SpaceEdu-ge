import { describe, expect, it } from "vitest";
import { A4_WIDTH_PX, sheetScale } from "./cv-sheet";

describe("sheetScale", () => {
  it("shrinks the A4 sheet to the space a phone has, never enlarges it", () => {
    expect(sheetScale(358)).toBeCloseTo(358 / A4_WIDTH_PX, 2);
    expect(sheetScale(328)).toBeLessThan(0.42);
    expect(sheetScale(1200)).toBe(1);
    expect(sheetScale(0)).toBe(1);
  });
});
