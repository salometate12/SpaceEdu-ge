import { describe, expect, it } from "vitest";
import {
  convertLayout,
  deleteField,
  deleteSlide,
  duplicateSlide,
  getField,
  insertPoint,
  insertSlideAfter,
  moveItem,
  newSlide,
  NEW_SLIDE_KINDS,
  nextSlideId,
  setField,
  slidePlainText,
} from "./presentation-deck";
import { relativeTimeKa } from "./relative-time-ka";
import { historyReducer, HISTORY_LIMIT, initHistory } from "./presentation-history";
import { pptxTextBlocks } from "./exportPptx";
import { textBoxFor } from "./presentation-layout";
import type { GeneratedSlide } from "./presentation-types";

const slide = (id: number, extra: Partial<GeneratedSlide> = {}): GeneratedSlide => ({
  id,
  type: "content",
  slideType: "ტექსტი",
  title: `სლაიდი ${id}`,
  layout: "prose",
  body: "პირველი წინადადება. მეორე წინადადება.",
  images: [],
  ...extra,
});

const deck = [slide(1, { type: "cover" }), slide(2), slide(3), slide(4, { type: "thanks" })];

describe("new slides", () => {
  it("go right after the selected slide, not after the thank-you slide", () => {
    const { slides, index } = insertSlideAfter(deck, 1, newSlide("bullets", nextSlideId(deck)));
    expect(index).toBe(2);
    expect(slides.map((s) => s.id)).toEqual([1, 2, 5, 3, 4]);
    expect(slides[2].layout).toBe("bullets");
  });

  it("every kind has a title and its layout's fields", () => {
    for (const kind of NEW_SLIDE_KINDS) {
      const s = newSlide(kind, 9);
      expect(s.title.length).toBeGreaterThan(0);
      expect(slidePlainText(s).length).toBeGreaterThan(0);
    }
    expect(newSlide("image", 9).type).toBe("image");
    expect(newSlide("thanks", 9, "en").title).toBe("Thank you for your attention!");
  });
});

describe("slide operations", () => {
  it("duplicates after the original with a new id and no photos", () => {
    const withPhoto = [slide(1, { images: [{ photoId: "p", x: 1, y: 1, w: 10, h: 10 }] }), slide(2)];
    const result = duplicateSlide(withPhoto, 0);
    expect(result.map((s) => s.id)).toEqual([1, 3, 2]);
    expect(result[1]).toMatchObject({ title: "სლაიდი 1", images: [] });
  });

  it("deletes and moves", () => {
    expect(deleteSlide(deck, 1).map((s) => s.id)).toEqual([1, 3, 4]);
    expect(moveItem(deck, 1, 2).map((s) => s.id)).toEqual([1, 3, 2, 4]);
    expect(moveItem(deck, 2, 0).map((s) => s.id)).toEqual([3, 1, 2, 4]);
  });
});

describe("convertLayout", () => {
  it("prose → bullets splits sentences, and switching back restores the text", () => {
    const bullets = convertLayout(slide(1), "bullets");
    expect(bullets.points).toEqual(["პირველი წინადადება.", "მეორე წინადადება."]);
    expect(convertLayout(bullets, "prose").body).toBe("პირველი წინადადება. მეორე წინადადება.");
  });

  it("bullets → two-column splits the points between the columns", () => {
    const s = slide(1, { layout: "bullets", body: undefined, points: ["ა", "ბ", "გ", "დ"] });
    expect(convertLayout(s, "two-column").columns?.map((c) => c.text)).toEqual(["ა ბ", "გ დ"]);
  });

  it("key-figure keeps the text as its caption", () => {
    expect(convertLayout(slide(1), "key-figure").figure).toEqual({
      value: "[მონაცემი მიუთითე]",
      caption: "პირველი წინადადება. მეორე წინადადება.",
    });
  });
});

describe("slidePlainText", () => {
  it("lists bullet points and quotes without markup", () => {
    expect(slidePlainText(slide(1, { layout: "bullets", points: ["ერთი", "ორი"] }))).toBe("სლაიდი 1\n\n• ერთი\n\n• ორი");
    expect(slidePlainText(slide(1, { layout: "quote", quote: { text: "ციტატა", author: "ავტორი" } }))).toBe(
      "სლაიდი 1\n\n„ციტატა“\n\n— ავტორი",
    );
  });
});

describe("historyReducer", () => {
  it("undoes and redoes, and a new commit clears redo", () => {
    let h = initHistory(1);
    h = historyReducer(h, { type: "commit", next: 2 });
    h = historyReducer(h, { type: "commit", next: 3 });
    h = historyReducer(h, { type: "undo" });
    expect(h.present).toBe(2);
    h = historyReducer(h, { type: "redo" });
    expect(h.present).toBe(3);
    h = historyReducer(h, { type: "undo" });
    h = historyReducer(h, { type: "commit", next: 9 });
    expect(h).toEqual({ past: [1, 2], present: 9, future: [] });
  });

  it(`keeps at most ${HISTORY_LIMIT} steps and ignores no-op commits`, () => {
    let h = initHistory(0);
    for (let i = 1; i <= 80; i += 1) h = historyReducer(h, { type: "commit", next: i });
    expect(h.past).toHaveLength(HISTORY_LIMIT);
    expect(historyReducer(h, { type: "commit", next: h.present })).toBe(h);
    expect(historyReducer(initHistory(0), { type: "undo" }).present).toBe(0);
  });
});

describe("export", () => {
  it("uses the edited text", () => {
    const edited = slide(2, { title: "ჩასწორებული სათაური", layout: "bullets", points: ["ახალი პუნქტი"] });
    const runs = pptxTextBlocks(edited, textBoxFor([])).flatMap((block) => block.runs.map((run) => run.text));
    expect(runs).toEqual(["ჩასწორებული სათაური", "ახალი პუნქტი"]);
  });
});

describe("text fields", () => {
  it("reads and writes every kind of text", () => {
    const s = slide(1, { layout: "two-column", columns: [{ heading: "ა", text: "ბ" }, { heading: "გ", text: "დ" }] });
    const edited = setField(s, { kind: "column-text", index: 1 }, "ახალი");
    expect(getField(edited, { kind: "column-text", index: 1 })).toBe("ახალი");
    expect(edited.columns?.[0]).toEqual({ heading: "ა", text: "ბ" });
    expect(getField(setField(s, { kind: "figure-value", }, "42%"), { kind: "figure-value" })).toBe("42%");
  });

  it("adds and removes points", () => {
    const s = slide(1, { layout: "bullets", points: ["ა", "ბ"] });
    expect(insertPoint(s, 1).points).toEqual(["ა", "", "ბ"]);
    expect(deleteField(s, { kind: "point", index: 0 }).points).toEqual(["ბ"]);
  });
});

describe("relativeTimeKa", () => {
  const now = new Date(2026, 9, 21, 12, 0).getTime();
  it("says how long ago", () => {
    expect(relativeTimeKa(now - 20_000, now)).toBe("ახლახან");
    expect(relativeTimeKa(now - 5 * 60_000, now)).toBe("5 წუთის წინ");
    expect(relativeTimeKa(now - 3 * 3_600_000, now)).toBe("3 საათის წინ");
    expect(relativeTimeKa(now - 30 * 3_600_000, now)).toBe("გუშინ");
    expect(relativeTimeKa(new Date(2026, 0, 5).getTime(), now)).toBe("05.01.2026");
  });
});
