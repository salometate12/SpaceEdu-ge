import { describe, expect, it } from "vitest";
import { A4_HEIGHT_PX, A4_WIDTH_PX, a4PageSlices, sheetScale } from "./cv-sheet";

describe("sheetScale", () => {
  it("shrinks the A4 sheet to the space a phone has, never enlarges it", () => {
    expect(sheetScale(358)).toBeCloseTo(358 / A4_WIDTH_PX, 2);
    expect(sheetScale(328)).toBeLessThan(0.42);
    expect(sheetScale(1200)).toBe(1);
    expect(sheetScale(0)).toBe(1);
  });
});

describe("a4PageSlices", () => {
  it("keeps an A4-tall sheet on one page", () => {
    expect(a4PageSlices(A4_WIDTH_PX, A4_HEIGHT_PX)).toEqual([{ y: 0, height: A4_HEIGHT_PX }]);
    expect(a4PageSlices(1588, 2246)).toHaveLength(1); // the same at scale 2
  });

  it("continues a long CV on more A4 pages", () => {
    const slices = a4PageSlices(A4_WIDTH_PX, 2600);
    expect(slices).toHaveLength(3);
    expect(slices[0]).toEqual({ y: 0, height: 1123 });
    expect(slices[2].y + slices[2].height).toBe(2600);
  });
});
