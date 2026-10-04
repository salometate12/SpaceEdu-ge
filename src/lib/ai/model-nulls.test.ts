import { describe, expect, it } from "vitest";
import { stripNulls } from "./model-nulls";

describe("stripNulls", () => {
  it("drops null keys deep inside objects and arrays", () => {
    expect(
      stripNulls({ a: null, b: "x", list: [{ c: null, d: 1 }], nested: { e: null, f: false } }),
    ).toEqual({ b: "x", list: [{ d: 1 }], nested: { f: false } });
  });
});
