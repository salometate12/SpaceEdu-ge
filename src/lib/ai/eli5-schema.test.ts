import { describe, expect, it } from "vitest";
import { Eli5ResponseSchema, stepEli5Level } from "./eli5-schema";
import { addToHistory, eli5ToNoteText, parseHistory, type Eli5HistoryItem } from "@/lib/eli5-history";

const ANSWER = {
  title: "ინფლაცია",
  analogy: "როცა ყველას უცებ მეტი ჯიბის ფული აქვს, ნაყინი ძვირდება.",
  simple: "ინფლაცია არის **ფასების საერთო ზრდა**.",
  example: "2022 წელს საქართველოში ინფლაცია 11.9% იყო.",
  oneLiner: "ფული ნელ-ნელა ნაკლებს ყიდულობს.",
};

describe("ELI5 response schema", () => {
  it("accepts the four parts", () => {
    expect(Eli5ResponseSchema.parse(ANSWER)).toEqual(ANSWER);
  });

  it("allows no example, as null", () => {
    expect(Eli5ResponseSchema.safeParse({ ...ANSWER, example: null }).success).toBe(true);
  });

  it("requires every key (strict mode): no optional fields", () => {
    for (const key of Object.keys(ANSWER)) {
      const partial: Record<string, unknown> = { ...ANSWER };
      delete partial[key];
      expect(Eli5ResponseSchema.safeParse(partial).success, key).toBe(false);
    }
    for (const [key, field] of Object.entries(Eli5ResponseSchema.shape)) {
      expect(field.isOptional(), key).toBe(false);
    }
    // `example` is nullable, not optional: undefined is rejected.
    expect(Eli5ResponseSchema.safeParse({ ...ANSWER, example: undefined }).success).toBe(false);
  });
});

describe("ELI5 levels", () => {
  it("steps simpler and deeper, and stops at the ends", () => {
    expect(stepEli5Level("school", -1)).toBe("kid");
    expect(stepEli5Level("school", 1)).toBe("freshman");
    expect(stepEli5Level("kid", -1)).toBeNull();
    expect(stepEli5Level("freshman", 1)).toBeNull();
  });
});

describe("ELI5 history", () => {
  const item = (query: string, at: number, level: Eli5HistoryItem["level"] = "kid"): Eli5HistoryItem => ({
    query,
    level,
    result: { ...ANSWER, title: query },
    at,
  });

  it("keeps the newest first, replaces the same topic and level, and caps at 20", () => {
    let history: Eli5HistoryItem[] = [];
    for (let index = 0; index < 25; index += 1) history = addToHistory(history, item(`თემა ${index}`, index));
    expect(history).toHaveLength(20);
    expect(history[0].query).toBe("თემა 24");
    history = addToHistory(history, item("თემა 20", 99));
    expect(history.filter((entry) => entry.query === "თემა 20")).toHaveLength(1);
    expect(history[0].at).toBe(99);
    history = addToHistory(history, item("თემა 20", 100, "freshman"));
    expect(history.filter((entry) => entry.query === "თემა 20")).toHaveLength(2);
  });

  it("ignores broken stored data", () => {
    expect(parseHistory("not json")).toEqual([]);
    expect(parseHistory(JSON.stringify([{ query: 1 }, item("ok", 1)]))).toHaveLength(1);
  });

  it("writes the journal entry in four parts, skipping a missing example", () => {
    expect(eli5ToNoteText(ANSWER)).toContain("**რეალური მაგალითი**");
    const text = eli5ToNoteText({ ...ANSWER, example: undefined });
    expect(text).not.toContain("მაგალითი**");
    expect(text.split("\n\n")).toHaveLength(3);
  });
});
