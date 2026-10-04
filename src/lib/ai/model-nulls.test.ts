import { describe, expect, it } from "vitest";
import { stripNulls } from "./model-nulls";
import { normalizeSyllabusMilestones } from "./syllabus-schema";

describe("stripNulls", () => {
  it("drops null keys deep inside objects and arrays", () => {
    expect(
      stripNulls({ a: null, b: "x", list: [{ c: null, d: 1 }], nested: { e: null, f: false } }),
    ).toEqual({ b: "x", list: [{ d: 1 }], nested: { f: false } });
  });
});

describe("normalizeSyllabusMilestones", () => {
  it("treats null like a missing field", () => {
    const [item] = normalizeSyllabusMilestones(
      [{ id: null, title: "შუალედური", date: "2026-11-02", week: null, topic: null, type: "midterm" }],
      "2026-09-14",
    );
    expect(item.id).toBe("syllabus-ms-1");
    expect(item.date).toBe("2026-11-02");
    expect(item).not.toHaveProperty("week");
    expect(item).not.toHaveProperty("topic");
  });
});
