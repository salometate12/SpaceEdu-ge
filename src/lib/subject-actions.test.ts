import { describe, expect, it } from "vitest";
import { joinExcerpts, studyPrompt } from "./subject-actions";

describe("subject actions", () => {
  it("starts the AI teacher on the topic with the agreed words", () => {
    expect(studyPrompt("ხეები და ორობითი ძებნა", "მონაცემთა სტრუქტურები")).toBe(
      "მოდი ვისწავლოთ თემა „ხეები და ორობითი ძებნა“ საგნიდან „მონაცემთა სტრუქტურები“. დაიწყე მთავარი ცნებებით.",
    );
  });

  it("puts each file's text under its name", () => {
    expect(joinExcerpts([{ name: "ლექცია 7.pdf", text: "ხეები" }, { name: "Cormen.pdf", text: "თავი 12" }])).toBe("### ლექცია 7.pdf\nხეები\n\n### Cormen.pdf\nთავი 12");
  });
});
