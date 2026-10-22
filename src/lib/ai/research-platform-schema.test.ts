import { describe, expect, it } from "vitest";
import { mergeResearchSections, ResearchPointSchema, ResearchResponseSchema, sectionPoints, type ResearchResponse } from "./research-platform-schema";

const ANSWER = {
  title: "კლიმატის ცვლილება და სოფლის მეურნეობა",
  summary: "სტატია განიხილავს…",
  theses: [{ text: "მოსავლიანობა **12%-ით** შემცირდა.", pages: [3, 4] }],
  methodology: null,
  literature: null,
  criticalAnalysis: { strengths: [{ text: "დიდი შერჩევა", pages: [5] }], weaknesses: [{ text: "მოკლე პერიოდი", pages: null }] },
  conclusions: null,
  sources: [],
  quotes: [],
};

describe("research response schema", () => {
  it("accepts sections as points with pages", () => {
    expect(ResearchResponseSchema.safeParse(ANSWER).success).toBe(true);
  });

  it("has pages as nullable, never optional (OpenAI strict)", () => {
    expect(ResearchPointSchema.safeParse({ text: "აუდიოს პუნქტი", pages: null }).success).toBe(true);
    expect(ResearchPointSchema.safeParse({ text: "გვერდის გარეშე" }).success).toBe(false);
    expect(ResearchPointSchema.shape.pages.isOptional()).toBe(false);
    for (const [key, field] of Object.entries(ResearchResponseSchema.shape)) {
      expect(field.isOptional(), key).toBe(false);
    }
  });

  it("rejects a page that isn't a number", () => {
    expect(ResearchPointSchema.safeParse({ text: "x", pages: ["3"] }).success).toBe(false);
  });
});

describe("research sections", () => {
  const current = ANSWER as unknown as ResearchResponse;

  it("adds a section without touching the others", () => {
    const added = { ...current, theses: [{ text: "ახალი", pages: [9] }], methodology: [{ text: "გამოკითხვა", pages: [2] }] } as ResearchResponse;
    const merged = mergeResearchSections(current, added, ["methodology"]);
    expect(merged.methodology).toEqual([{ text: "გამოკითხვა", pages: [2] }]);
    expect(merged.theses).toEqual(current.theses);
  });

  it("flattens the critique into points", () => {
    expect(sectionPoints(current, "criticalAnalysis").map((point) => point.text)).toEqual(["დიდი შერჩევა", "მოკლე პერიოდი"]);
    expect(sectionPoints(current, "methodology")).toEqual([]);
  });
});
