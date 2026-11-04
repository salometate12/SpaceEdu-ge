import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { cleanCheck, partRange } from "./schemas";
import { estimateMinutes, estimateParts, missedTopics, progressOf, remainingMinutes, scoreOf, sourceLabel } from "./sessions";
import { renderUnits, splitIntoPieces, splitPdfPages, unitsFor, validRefs, type SourceUnit } from "./sources";

const unit = (fileId: string, n: number, text = `ტექსტი ${n}`, kind: "slide" | "page" = "slide"): SourceUnit => ({ fileId, fileName: `${fileId}.pptx`, kind, unit: n, text });
const check = (correctIndex: number) => ({ question: "კითხვა?", options: ["ა", "ბ", "გ"], correctIndex, feedback: "იმიტომ" });
const part = (correctIndex: number) => ({ explanation: "ახსნა", example: null, check: check(correctIndex) });

describe("the material, split", () => {
  it("a PDF's pages come back from its page markers", () => {
    expect(splitPdfPages("--- გვერდი 1 ---\nპირველი\n\n--- გვერდი 3 ---\nმესამე")).toEqual([
      { unit: 1, text: "პირველი" },
      { unit: 3, text: "მესამე" },
    ]);
    expect(splitPdfPages("უბრალო ტექსტი")).toEqual([{ unit: 1, text: "უბრალო ტექსტი" }]);
  });

  it("text without pages in page-sized pieces, paragraphs kept whole", () => {
    const pieces = splitIntoPieces(["ა".repeat(60), "ბ".repeat(60), "გ".repeat(60)].join("\n\n"), 100);
    expect(pieces).toEqual(["ა".repeat(60), "ბ".repeat(60), "გ".repeat(60)]);
  });

  it("each file under its id, each slide under its number, every file kept within the budget", () => {
    const text = renderUnits([unit("f1", 1, "ა".repeat(500)), unit("f2", 1, "ბ".repeat(500))], 400);
    expect(text).toContain("### ფაილი f1");
    expect(text).toContain("### ფაილი f2");
    expect(text).toContain("[სლაიდი 1]");
    expect(text.length).toBeLessThan(700);
  });

  it("a plan may only point at slides that exist, once each", () => {
    const units = [unit("f1", 1), unit("f1", 2)];
    expect(validRefs([{ fileId: "f1", unit: 2 }, { fileId: "f1", unit: 9 }, { fileId: "x", unit: 1 }, { fileId: "f1", unit: 2 }], units)).toEqual([{ fileId: "f1", unit: 2 }]);
  });

  it("a part reads its own slides, with neighbours when they're short", () => {
    const units = [unit("f1", 1, "ა"), unit("f1", 2, "ბ"), unit("f1", 3, "გ"), unit("f1", 5, "ე")];
    expect(unitsFor([{ fileId: "f1", unit: 2 }], units).map((item) => item.unit)).toEqual([1, 2, 3]);
    expect(unitsFor([{ fileId: "f1", unit: 2 }], units, 0).map((item) => item.unit)).toEqual([2]);
  });
});

describe("a session's numbers", () => {
  it("parts per mode and an estimate", () => {
    expect(partRange("full")).toEqual([5, 10]);
    expect(partRange("quick")).toEqual([3, 5]);
    expect(estimateMinutes([{ size: 2 * 1024 * 1024 }], "quick")).toBe(15);
    const minutes = estimateMinutes([{ size: 2 * 1024 * 1024 }, { size: 1024 * 1024 }]);
    expect(minutes % 5).toBe(0);
    expect(estimateParts(minutes)).toBeGreaterThanOrEqual(5);
  });

  it("progress, time left and the score", () => {
    const session = {
      plan: [{ title: "ა", refs: [] }, { title: "ბ", refs: [] }, { title: "გ", refs: [] }, { title: "დ", refs: [] }],
      parts: [part(0), part(1), part(2), null],
      answers: [0, 2, null, null],
      estimateMinutes: 20,
    };
    expect(progressOf(session)).toEqual({ done: 2, total: 4 });
    expect(remainingMinutes(session)).toBe(10);
    expect(scoreOf(session)).toEqual({ correct: 1, total: 3, wrong: [1] });
  });

  it("„შემამოწმე“: only what was answered wrong is explained", () => {
    const questions = [
      { ...check(0), topic: "პროცესები", refs: [] },
      { ...check(1), topic: "ნაკადები", refs: [] },
      { ...check(2), topic: "ნაკადები", refs: [] },
    ];
    expect(missedTopics(questions, [0, 0, 0])).toEqual(["ნაკადები"]);
    expect(missedTopics(questions, [0, 1, 2])).toEqual([]);
  });

  it("the source chip: the file's name and its slide or page", () => {
    const session = { files: [{ id: "f1", name: "ლექცია 2.pptx", size: 1, mime: "", storagePath: null }], kinds: { f1: "slide" as const } };
    expect(sourceLabel({ fileId: "f1", unit: 4 }, session)).toBe("ლექცია 2, სლაიდი 4");
    expect(sourceLabel({ fileId: "f1", unit: 4 }, { ...session, kinds: { f1: "page" } })).toBe("ლექცია 2, გვერდი 4");
    expect(sourceLabel(undefined, session)).toBeNull();
  });

  it("a question is kept to three options and a valid answer", () => {
    expect(cleanCheck({ question: "ქ?", options: ["ა", "ბ", "გ", "დ"], correctIndex: 5, feedback: " ფ " })).toEqual({ question: "ქ?", options: ["ა", "ბ", "გ"], correctIndex: 2, feedback: "ფ" });
    expect(cleanCheck({ question: "ქ?", options: ["ა"], correctIndex: 0, feedback: "" })).toBeNull();
  });
});

describe("a question's feedback", () => {
  it("never starts with a verdict (the screen shows right or wrong)", () => {
    expect(cleanCheck({ question: "ქ?", options: ["ა", "ბ", "გ"], correctIndex: 1, feedback: "სწორია! კონტექსტის გადართვისას PCB ინახება." })?.feedback).toBe("კონტექსტის გადართვისას PCB ინახება.");
    expect(cleanCheck({ question: "ქ?", options: ["ა", "ბ", "გ"], correctIndex: 1, feedback: "ზუსტად ასეა! კვანტი ამოიწურება." })?.feedback).toBe("კვანტი ამოიწურება.");
  });
});

describe("a part starts with its content", () => {
  it("a greeting or „let's look at“ opening is cut", async () => {
    const { withoutGreeting } = await import("./schemas");
    expect(withoutGreeting("გამარჯობა! დღეს გავეცნობით, თუ რა არის **პროცესი** ოპერაციულ სისტემებში. პროცესი არის პროგრამა.")).toBe("პროცესი არის პროგრამა.");
    expect(withoutGreeting("მოგესალმებით მეგობრებო. **პროცესი** არის პროგრამა.")).toBe("**პროცესი** არის პროგრამა.");
    expect(withoutGreeting("**პროცესი** არის პროგრამა.")).toBe("**პროცესი** არის პროგრამა.");
  });
});

describe("another script in a Georgian lesson", () => {
  it("is noticed and removed; Georgian, Latin and maths stay", async () => {
    const { hasForeignScript, withoutForeignScript } = await import("./schemas");
    expect(hasForeignScript("სპეციალურ结构-ს")).toBe(true);
    expect(hasForeignScript("როდესაც පරිගენტერში")).toBe(true);
    expect(hasForeignScript("**PCB** და $\\frac{1}{2}$ − Round Robin")).toBe(false);
    expect(withoutForeignScript("სპეციალურ结构-ს")).toBe("სპეციალურ-ს");
  });
});
