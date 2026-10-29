import { describe, expect, it } from "vitest";
import { clampCardCount, parseAvoidQuestions, splitCardCount, formatClock, GenerationInputError, parseCardCount, parseClock, sliceTranscript } from "./generation-options";

describe("card count", () => {
  it("clamps a typed value to 5–50", () => {
    expect([3, 5, 27.6, 50, 80, Number.NaN].map(clampCardCount)).toEqual([5, 5, 28, 50, 50, 20]);
  });
  it("accepts 5–50 from the form and defaults when missing", () => {
    expect(parseCardCount("50")).toBe(50);
    expect(parseCardCount(null)).toBe(20);
  });
  it("refuses more than 50 with a Georgian message", () => {
    expect(() => parseCardCount("60")).toThrow(GenerationInputError);
    expect(() => parseCardCount("60")).toThrow(/მაქსიმუმ 50/);
    expect(() => parseCardCount("4")).toThrow(GenerationInputError);
    expect(() => parseCardCount("7.5")).toThrow(GenerationInputError);
  });
});

describe("clock", () => {
  it("parses mm:ss and h:mm:ss", () => {
    expect(parseClock("2:05")).toBe(125);
    expect(parseClock("1:02:05")).toBe(3725);
    expect(parseClock("2:75")).toBeNull();
    expect(parseClock("abc")).toBeNull();
    expect(formatClock(3725)).toBe("1:02:05");
    expect(formatClock(65)).toBe("1:05");
  });
});

describe("sliceTranscript", () => {
  it("keeps the part between start and end, in seconds", () => {
    const segments = [{ text: "ა", offset: 0 }, { text: "ბ", offset: 30 }, { text: "გ", offset: 90 }];
    expect(sliceTranscript(segments, 20, 60)).toBe("ბ");
  });
  it("understands millisecond offsets", () => {
    const segments = [{ text: "ა", offset: 0 }, { text: "ბ", offset: 30_000 }, { text: "გ", offset: 25_000_000 }];
    expect(sliceTranscript(segments, 20, 60)).toBe("ბ");
  });
});

describe("splitCardCount", () => {
  it("asks for big decks in parts of at most 25", () => {
    expect(splitCardCount(50)).toEqual([25, 25]);
    expect(splitCardCount(33)).toEqual([17, 16]);
    expect(splitCardCount(20)).toEqual([20]);
    expect(splitCardCount(25)).toEqual([25]);
  });
  it("reads the questions to avoid, safely", () => {
    expect(parseAvoidQuestions(JSON.stringify(["ა?", "", 3, "ბ?"]))).toEqual(["ა?", "ბ?"]);
    expect(parseAvoidQuestions("not json")).toEqual([]);
    expect(parseAvoidQuestions(null)).toEqual([]);
  });
});
