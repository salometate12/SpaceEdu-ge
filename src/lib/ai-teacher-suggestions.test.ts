import { describe, expect, it } from "vitest";
import { buildSuggestions, dueDay, onSubject, type SuggestionContext } from "./ai-teacher-suggestions";

const FALLBACK = [
  { title: "ლექციის თემის ახსნა", prompt: "ა" },
  { title: "შუალედურისთვის მზადება", prompt: "ბ" },
  { title: "ესეს სტრუქტურა", prompt: "გ" },
  { title: "ამოცანის გარჩევა", prompt: "დ" },
];

const base = (over: Partial<SuggestionContext> = {}): SuggestionContext => ({
  space: "student",
  subjects: [],
  notes: [],
  events: [],
  today: "2026-10-22",
  fallback: FALLBACK,
  ...over,
});

const STATS = { name: "სტატისტიკა", color: "#1e3a8a" };
const MICRO = { name: "მიკროეკონომიკა", color: "#9d174d" };

describe("AI teacher suggestions", () => {
  it("shows the general cards when no subjects are added", () => {
    const cards = buildSuggestions(base());
    expect(cards.map((card) => card.title)).toEqual(FALLBACK.map((card) => card.title));
    expect(cards.every((card) => card.subject === null)).toBe(true);
    expect(cards.map((card) => card.kind)).toEqual(["lecture", "exam", "assignment", "quiz"]);
  });

  it("builds four cards on one subject", () => {
    const cards = buildSuggestions(base({ subjects: [STATS] }));
    expect(cards).toHaveLength(4);
    expect(cards.map((card) => card.subject)).toEqual(["სტატისტიკა", "სტატისტიკა", "სტატისტიკა", "სტატისტიკა"]);
    expect(cards[3].description).toBe("5 კითხვა სტატისტიკაზე");
  });

  it("uses the latest entry, the nearest exam and deadline, and the stalest subject", () => {
    const cards = buildSuggestions(
      base({
        subjects: [STATS, MICRO],
        notes: [
          { title: "ელასტიურობა", subject: "მიკროეკონომიკა", date: "2026-10-21", updatedAt: 200 },
          { title: "ძველი", subject: "მიკროეკონომიკა", date: "2026-10-01", updatedAt: 100 },
        ],
        events: [
          { title: "სტატისტიკის ფინალური", date: "2026-12-20", type: "final" },
          { title: "სტატისტიკის შუალედური", date: "2026-10-29", type: "midterm" },
          { title: "ესე #2", date: "2026-10-24", type: "deadline", description: "მიკროეკონომიკა" },
        ],
      }),
    );
    expect(cards[0]).toMatchObject({ subject: "მიკროეკონომიკა", description: "ბოლო ლექცია: ელასტიურობა — ამიხსენი მაგალითით" });
    expect(cards[0].context).toContain("2026-10-21");
    expect(cards[1]).toMatchObject({ subject: "სტატისტიკა", description: "შუალედური 29 ოქტ — 7-დღიანი გეგმა" });
    expect(cards[2]).toMatchObject({ subject: "მიკროეკონომიკა", description: "„ესე #2“ — ჩაბარება შაბათს, გავარჩიოთ ნაბიჯ-ნაბიჯ" });
    // სტატისტიკა has no entry at all: the longest without work.
    expect(cards[3]).toMatchObject({ subject: "სტატისტიკა", description: "5 კითხვა სტატისტიკაზე" });
  });

  it("skips dates in the past", () => {
    const cards = buildSuggestions(
      base({
        subjects: [STATS],
        events: [
          { title: "გასული შუალედური", date: "2026-10-01", type: "midterm" },
          { title: "გასული დავალება", date: "2026-10-21", type: "deadline" },
        ],
      }),
    );
    expect(cards[1].description).toBe("სტატისტიკა: გამეორების გეგმა");
    expect(cards[2].description).toBe("სტატისტიკა: დავალების ნაბიჯ-ნაბიჯ გარჩევა");
  });

  it("gives the abiturient exam-prep cards on their subjects", () => {
    const cards = buildSuggestions(
      base({
        space: "abiturient",
        subjects: [
          { name: "მათემატიკა", color: "#0e7490" },
          { name: "ისტორია", color: "#5b21b6" },
        ],
      }),
    );
    expect(cards).toHaveLength(4);
    expect(cards[1].description).toBe("ისტორია: ტესტის ტიპური ამოცანა");
    expect(cards[3].description).toBe("5 კითხვა ისტორიაზე");
    expect(cards.every((card) => card.prompt.includes("ეროვნული გამოცდის"))).toBe(true);
  });
});

describe("AI teacher suggestions: wording", () => {
  it("adds -ზე the Georgian way", () => {
    expect(onSubject("სტატისტიკა")).toBe("სტატისტიკაზე");
    expect(onSubject("მონაცემთა სტრუქტურები")).toBe("მონაცემთა სტრუქტურებზე");
    expect(onSubject("ქართული ენა")).toBe("ქართულ ენაზე");
    expect(onSubject("სამოქალაქო განათლება")).toBe("სამოქალაქო განათლებაზე");
  });

  it("names the due day", () => {
    expect(dueDay("2026-10-22", "2026-10-22")).toBe("დღეს");
    expect(dueDay("2026-10-23", "2026-10-22")).toBe("ხვალ");
    expect(dueDay("2026-11-15", "2026-10-22")).toBe("15 ნოე-ს");
  });
});
