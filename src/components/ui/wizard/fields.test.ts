import { describe, expect, it } from "vitest";
import { splitTagInput } from "./fields";

describe("splitTagInput", () => {
  it("turns what's before each comma into tags and keeps the rest typing", () => {
    expect(splitTagInput("Figma, Excel, Pyth")).toEqual({ tags: ["Figma", "Excel"], rest: " Pyth" });
    expect(splitTagInput("Word")).toEqual({ tags: [], rest: "Word" });
    expect(splitTagInput(",,Excel,")).toEqual({ tags: ["Excel"], rest: "" });
  });
});
