import { describe, expect, it } from "vitest";
import { mergeCardParts } from "./generate-flashcards";

describe("mergeCardParts", () => {
  it("drops a question asked twice (ignoring case and punctuation) and stops at the limit", () => {
    const cards = mergeCardParts(
      [
        [
          { question: "რა არის უჯრედი?", answer: "ა" },
          { question: "რა არის მიტოზი?", answer: "ბ" },
        ],
        [
          { question: "რა არის უჯრედი", answer: "გ" },
          { question: "რა არის მეიოზი?", answer: "დ" },
          { question: "რა არის ოსმოსი?", answer: "ე" },
        ],
      ],
      3,
    );
    expect(cards.map((card) => card.answer)).toEqual(["ა", "ბ", "დ"]);
  });
});
