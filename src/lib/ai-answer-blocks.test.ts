import { describe, expect, it } from "vitest";
import { keyIdeaText, markColor, parseAnswer, splitStepItem } from "./ai-answer-blocks";

describe("AI answer: marker colours", () => {
  it("turns yellow → pink → green and starts over", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(markColor)).toEqual([
      "yellow",
      "pink",
      "green",
      "yellow",
      "pink",
      "green",
      "yellow",
    ]);
  });
});

describe("AI answer: the key idea", () => {
  it("recognises „მთავარი იდეა:“ with or without bold", () => {
    expect(keyIdeaText("**მთავარი იდეა:** ჯერ ჩონჩხი.")).toBe("ჯერ ჩონჩხი.");
    expect(keyIdeaText("**მთავარი იდეა**: ჯერ ჩონჩხი.")).toBe("ჯერ ჩონჩხი.");
    expect(keyIdeaText("მთავარი იდეა: ჯერ ჩონჩხი.")).toBe("ჯერ ჩონჩხი.");
  });

  it("leaves other quotes alone", () => {
    expect(keyIdeaText("მთავარი: ზომიერი ინფლაცია ნორმალურია.")).toBeNull();
    const blocks = parseAnswer("ტექსტი.\n\n> ჩვეულებრივი ციტატა.");
    expect(blocks.map((block) => block.type)).toEqual(["paragraph", "quote"]);
  });

  it("turns the closing key-idea quote into a card", () => {
    const blocks = parseAnswer("ტექსტი.\n\n> **მთავარი იდეა:** ჯერ ჩონჩხი, მერე შინაარსი.\n\nგინდა, გავაგრძელოთ?");
    expect(blocks).toEqual([
      { type: "paragraph", text: "ტექსტი." },
      { type: "idea", text: "ჯერ ჩონჩხი, მერე შინაარსი." },
      { type: "paragraph", text: "გინდა, გავაგრძელოთ?" },
    ]);
  });
});

describe("AI answer: numbered steps", () => {
  it("splits a bold title off the step's text", () => {
    expect(splitStepItem("**სტრუქტურა შექმენი** — ჯერ ფურცელზე.")).toEqual({
      title: "სტრუქტურა შექმენი",
      body: [{ type: "paragraph", text: "ჯერ ფურცელზე." }],
    });
    expect(splitStepItem("**სტრუქტურა:** ჯერ ფურცელზე.").title).toBe("სტრუქტურა");
    expect(splitStepItem("უბრალოდ ტექსტი **შიგნით** bold-ით.")).toEqual({
      title: "",
      body: [{ type: "paragraph", text: "უბრალოდ ტექსტი **შიგნით** bold-ით." }],
    });
  });

  it("makes an ordered list into steps, an unordered one stays a list", () => {
    const blocks = parseAnswer("1. **ერთი** — ა\n2. **ორი** — ბ\n\n- პუნქტი");
    expect(blocks[0]).toMatchObject({ type: "steps", steps: [{ title: "ერთი" }, { title: "ორი" }] });
    expect(blocks[1]).toMatchObject({ type: "list", ordered: false });
  });

  it("makes headings „1. …“, „2. …“ into steps with the text under them", () => {
    const blocks = parseAnswer("შესავალი.\n\n### 1. მოამზადე\nპირველი.\n\n### 2. გაუშვი\nმეორე.\n\n## სხვა\nბოლო.");
    expect(blocks).toEqual([
      { type: "paragraph", text: "შესავალი." },
      {
        type: "steps",
        steps: [
          { title: "მოამზადე", body: [{ type: "paragraph", text: "პირველი." }] },
          { title: "გაუშვი", body: [{ type: "paragraph", text: "მეორე." }] },
        ],
      },
      { type: "heading", level: 2, text: "სხვა" },
      { type: "paragraph", text: "ბოლო." },
    ]);
  });

  it("keeps a simple answer as plain text", () => {
    expect(parseAnswer("ფოტოსინთეზი **სინათლის** ენერგიას იყენებს.").map((block) => block.type)).toEqual(["paragraph"]);
  });
});
