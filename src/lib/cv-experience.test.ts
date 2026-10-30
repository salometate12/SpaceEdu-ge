import { describe, expect, it } from "vitest";
import { experienceLine, experiencesForPrompt, normalizeExperiences } from "./cv-experience";

describe("normalizeExperiences", () => {
  it("keeps the list, trims it and drops empty entries", () => {
    expect(
      normalizeExperiences({
        experiences: [
          { role: " სტაჟიორი ", place: "TBC", description: "ვაკეთებდი გვერდებს" },
          { role: "", place: "", description: "  " },
        ],
      }),
    ).toEqual([{ role: "სტაჟიორი", place: "TBC", description: "ვაკეთებდი გვერდებს" }]);
  });
  it("turns the old single text into the first entry", () => {
    expect(normalizeExperiences({ experienceText: "ვიმუშავე პროექტზე" })).toEqual([{ role: "", place: "", description: "ვიმუშავე პროექტზე" }]);
    expect(normalizeExperiences({})).toEqual([]);
  });
  it("keeps at most six", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ role: `r${i}`, place: "", description: "" }));
    expect(normalizeExperiences({ experiences: many })).toHaveLength(6);
  });
});

describe("experience text", () => {
  it("writes one line per entry and numbered blocks for the model", () => {
    expect(experienceLine({ role: "სტაჟიორი", place: "TBC", description: "ტესტები" })).toBe("სტაჟიორი, TBC: ტესტები");
    expect(experienceLine({ role: "", place: "", description: "მხოლოდ ტექსტი" })).toBe("მხოლოდ ტექსტი");
    expect(experiencesForPrompt([{ role: "სტაჟიორი", place: "", description: "ტესტები" }])).toContain("1. პოზიცია ან პროექტი: სტაჟიორი");
    expect(experiencesForPrompt([])).toBe("არ არის მითითებული");
  });
});
