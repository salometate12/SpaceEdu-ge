import { describe, expect, it } from "vitest";
import {
  checkBullets,
  convertExcessBullets,
  deckLanguage,
  ensureThanksSlide,
  findAiTells,
  normalizePlaceholders,
  pointsToProse,
  type StyleSlide,
} from "./presentation-style";
import { normalizePresentationLevel, PRESENTATION_LEVELS } from "./presentation-constants";
import { buildUserPrompt } from "./ai/build-user-prompt";
import { pptxAccentBars, pptxTextBlocks } from "./exportPptx";
import { keyFigureSize, textBoxFor } from "./presentation-layout";

const slide = (layout: StyleSlide["layout"], extra: Partial<StyleSlide> = {}): StyleSlide => ({
  type: "content",
  title: "სათაური",
  layout,
  body: layout === "prose" ? "ტექსტი." : null,
  points: layout === "bullets" ? ["ერთი", "ორი"] : null,
  ...extra,
});
const cover: StyleSlide = { type: "cover", title: "თემა", layout: "section", body: "ქვესათაური" };

describe("levels", () => {
  it("offers bachelor / master / doctorate", () => {
    expect(PRESENTATION_LEVELS).toEqual(["ბაკალავრიატი", "მაგისტრატურა", "დოქტორანტურა"]);
  });

  it("maps old values to bachelor", () => {
    for (const old of ["უნივერსიტეტი", "სკოლა", "ეროვნულები", undefined, ""]) {
      expect(normalizePresentationLevel(old)).toBe("ბაკალავრიატი");
    }
    expect(normalizePresentationLevel("დოქტორანტურა")).toBe("დოქტორანტურა");
  });

  it("tells the model the level and what it means, and asks for one slide fewer", () => {
    const prompt = buildUserPrompt("presentation", { topic: "x", slideCount: 10, level: "მაგისტრატურა" });
    expect(prompt).toContain("აუდიტორიის დონე: მაგისტრატურა");
    expect(prompt).toContain("compare theories");
    expect(prompt).toContain("სლაიდების რაოდენობა: 9");
    expect(buildUserPrompt("presentation", { topic: "x", level: "უნივერსიტეტი" })).toContain("დონე: ბაკალავრიატი");
  });
});

describe("findAiTells", () => {
  it("finds stock phrases and patterns", () => {
    const text = "მნიშვნელოვანია აღინიშნოს, რომ ეს ინოვაციური მიდგომა გადამწყვეტ როლს ასრულებს 🚀\n**ტერმინი:** ახსნა";
    const tells = findAiTells(text);
    expect(tells).toEqual(expect.arrayContaining(["მნიშვნელოვანია აღინიშნოს", "ინოვაციური", "გადამწყვეტ როლს ასრულებს", "emoji", "**ტერმინი:** პუნქტი"]));
  });

  it("leaves plain academic text alone", () => {
    expect(findAiTells("ინფლაცია ამცირებს ხელფასების რეალურ ღირებულებას, თუ ნომინალური ხელფასი არ იცვლება.")).toEqual([]);
  });
});

describe("bullet share", () => {
  it("allows bullets on at most ~30% of content slides, never two in a row", () => {
    const good = [cover, slide("bullets"), slide("prose"), slide("quote"), slide("prose"), slide("bullets"), slide("prose"), slide("key-figure")];
    expect(checkBullets(good).ok).toBe(true);
    const tooMany = [cover, slide("bullets"), slide("prose"), slide("bullets"), slide("prose"), slide("bullets"), slide("prose")];
    expect(checkBullets(tooMany).ok).toBe(false);
    const inARow = [cover, slide("bullets"), slide("bullets"), slide("prose"), slide("prose"), slide("prose"), slide("prose"), slide("prose")];
    expect(checkBullets(inARow)).toMatchObject({ consecutive: true, ok: false });
  });

  it("treats a slide without a layout but with points as bullets", () => {
    expect(checkBullets([slide(null, { points: ["a", "b"] }), slide(null, { points: ["a", "b"] })]).consecutive).toBe(true);
  });

  it("as a last resort turns the excess bullet slides into prose", () => {
    const fixed = convertExcessBullets([cover, slide("bullets"), slide("bullets"), slide("bullets"), slide("prose")]);
    expect(checkBullets(fixed).ok).toBe(true);
    expect(fixed[2]).toMatchObject({ layout: "prose", points: null });
    expect(fixed[2].body).toBe("ერთი. ორი.");
  });

  it("joins points into sentences, dropping bold labels", () => {
    expect(pointsToProse(["**ფასი:** იზრდება", "მოთხოვნა მცირდება."])).toBe("იზრდება. მოთხოვნა მცირდება.");
  });
});

describe("thank-you slide", () => {
  const deck = [cover, slide("prose"), slide("prose", { type: "conclusion" })];

  it("is appended in the deck's language", () => {
    const ka = ensureThanksSlide(deck, "ka");
    expect(ka).toHaveLength(4);
    expect(ka.at(-1)).toMatchObject({ type: "thanks", title: "მადლობა ყურადღებისთვის!", footnote: "კითხვები?" });
    expect(ensureThanksSlide(deck, "en").at(-1)).toMatchObject({ title: "Thank you for your attention!", footnote: "Questions?" });
    expect(ensureThanksSlide(deck, "both").at(-1)).toMatchObject({
      title: "მადლობა ყურადღებისთვის!",
      body: "Thank you for your attention!",
      footnote: "კითხვები? · Questions?",
    });
  });

  it("never doubles when the model already wrote one", () => {
    const withThanks = [...deck, slide("section", { title: "გმადლობთ ყურადღებისთვის" })];
    const result = ensureThanksSlide(withThanks, "ka");
    expect(result).toHaveLength(4);
    expect(result.filter((s) => s.type === "thanks")).toHaveLength(1);
  });

  it("maps the wizard's language choice", () => {
    expect(deckLanguage("ქართული")).toBe("ka");
    expect(deckLanguage("ინგლისური")).toBe("en");
    expect(deckLanguage("ქართული + ინგლისური")).toBe("both");
  });
});

describe("PPTX text blocks per layout", () => {
  const box = textBoxFor([]);
  const base = { id: 1, slideType: "", images: [] };

  it("centres the thank-you slide", () => {
    const [title, footnote] = pptxTextBlocks({ ...base, type: "thanks", title: "მადლობა ყურადღებისთვის!", footnote: "კითხვები?" }, box);
    expect(title).toMatchObject({ align: "center", valign: "bottom" });
    expect(title.runs[0].text).toBe("მადლობა ყურადღებისთვის!");
    expect(footnote.runs[0].text).toBe("კითხვები?");
    // The accent bar sits between them.
    const [bar] = pptxAccentBars({ ...base, type: "thanks", title: "მადლობა" }, box);
    expect(bar.y).toBeGreaterThan(title.box.y + title.box.h);
    expect(bar.y + bar.h).toBeLessThan(footnote.box.y);
  });

  it("puts two columns side by side", () => {
    const blocks = pptxTextBlocks({ ...base, type: "content", title: "შედარება", layout: "two-column", columns: [{ heading: "A", text: "a" }, { heading: "B", text: "b" }] }, box);
    expect(blocks).toHaveLength(3);
    expect(blocks[2].box.x).toBeGreaterThan(blocks[1].box.x + blocks[1].box.w);
  });

  it("draws the key figure big in the accent colour, then its caption", () => {
    const blocks = pptxTextBlocks({ ...base, type: "content", title: "ციფრი", layout: "key-figure", figure: { value: "[მონაცემი მიუთითე]", caption: "ახსნა" } }, box);
    expect(blocks[1].runs[0]).toMatchObject({ tone: "accent", bold: true });
    expect(blocks[2].runs[0].text).toBe("ახსნა");
  });

  it("shrinks a long key figure so it doesn't run into the caption", () => {
    expect(keyFigureSize("27%")).toBe(8);
    expect(keyFigureSize("[მონაცემი მიუთითე]")).toBeLessThan(5);
  });

  it("adds the accent bars the screen shows", () => {
    expect(pptxAccentBars({ ...base, type: "thanks", title: "მადლობა" }, box)).toHaveLength(1);
    expect(pptxAccentBars({ ...base, type: "content", title: "t", layout: "two-column", columns: [{ heading: "A", text: "a" }, { heading: "B", text: "b" }] }, box)).toHaveLength(2);
    expect(pptxAccentBars({ ...base, type: "content", title: "t", layout: "prose", body: "x" }, box)).toEqual([]);
  });

  it("keeps prose as one paragraph and quotes with their author", () => {
    expect(pptxTextBlocks({ ...base, type: "content", title: "t", layout: "prose", body: "აბზაცი." }, box)[1].runs[0].text).toBe("აბზაცი.");
    const quote = pptxTextBlocks({ ...base, type: "content", title: "t", layout: "quote", quote: { text: "ციტატა", author: "ავტორი" } }, box)[1];
    expect(quote.runs.map((r) => r.text)).toEqual(["„ციტატა“", "ავტორი"]);
  });
});

describe("placeholders", () => {
  it("fixes misspelled source/data placeholders", () => {
    expect(normalizePlaceholders("[მონაცემი მიუთიტე] %")).toBe("[მონაცემი მიუთითე] %");
    expect(normalizePlaceholders("[ წყარო მიუთითეთ ]")).toBe("[წყარო მიუთითე]");
    expect(normalizePlaceholders("[წყარო მიუთითე]")).toBe("[წყარო მიუთითე]");
  });
});
