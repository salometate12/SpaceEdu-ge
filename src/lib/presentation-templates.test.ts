import { describe, expect, it } from "vitest";
import { colorBullets, pptxAccentBars, pptxBullet, pptxTextBlocks, pptxTitleDecor } from "./exportPptx";
import { geometricShapes } from "./presentation-decor";
import { textBoxFor } from "./presentation-layout";
import { PRESENTATION_TEMPLATES, presentationTemplate } from "./presentation-templates";
import { DEFAULT_TEMPLATE_ID, slideTheme, themedTextBox, titleDecor } from "./presentation-theme";
import type { GeneratedSlide } from "./presentation-types";

/** WCAG relative luminance contrast. */
function contrast(a: string, b: string): number {
  const lum = (color: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const NEW = ["aurora", "geometric", "paper", "graphite"];
const slide = (extra: Partial<GeneratedSlide>): GeneratedSlide => ({
  id: 1,
  type: "content",
  slideType: "",
  title: "სათაური",
  layout: "bullets",
  points: ["ერთი", "ორი"],
  images: [],
  ...extra,
});

describe("templates", () => {
  it("lists the four new ones first, marked new, and keeps the original six", () => {
    expect(PRESENTATION_TEMPLATES.slice(0, 4).map((t) => [t.id, t.isNew])).toEqual(NEW.map((id) => [id, true]));
    expect(PRESENTATION_TEMPLATES.slice(4).map((t) => t.id)).toEqual(["galaxy", "ocean", "forest", "sunset", "minimal", "bold"]);
  });

  it("slideTheme returns a full theme for every template", () => {
    for (const template of PRESENTATION_TEMPLATES) {
      const theme = slideTheme(template.id);
      for (const key of ["bg", "title", "body", "accent"] as const) expect(theme[key]).toMatch(/^#[0-9A-F]{6}$/i);
    }
    for (const id of NEW) {
      const theme = slideTheme(id);
      expect(theme.fontTitle && theme.fontBody && theme.pptxFontTitle && theme.pptxFontBody && theme.decor && theme.bulletStyle).toBeTruthy();
    }
  });

  it("new presentations start on Paper; unknown ids fall back to it", () => {
    expect(DEFAULT_TEMPLATE_ID).toBe("paper");
    expect(presentationTemplate("nope").id).toBe("paper");
    expect(slideTheme("nope")).toBe(slideTheme("paper"));
  });

  it("text meets WCAG AA on the new templates", () => {
    for (const id of NEW) {
      const theme = slideTheme(id);
      expect(contrast(theme.title, theme.bg), `${id} title`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.body, theme.bg), `${id} body`).toBeGreaterThanOrEqual(4.5);
      // the accent is used for large text (key figure) or markers only
      expect(contrast(theme.figure ?? theme.accent, theme.bg), `${id} figure`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("decoration", () => {
  it("geometric circles stay round and get bigger on the cover", () => {
    const content = geometricShapes(false);
    const cover = geometricShapes(true);
    for (const shape of [...content, ...cover]) if (shape.kind === "ellipse") expect(shape.h).toBeCloseTo((shape.w * 16) / 9);
    expect(cover[0].w).toBeGreaterThan(content[0].w);
    expect(cover.length).toBeGreaterThan(content.length);
  });

  it("geometric shapes on content slides stay clear of the text box", () => {
    const { text } = themedTextBox(slideTheme("geometric"), textBoxFor([]), "content");
    // Work in slide-width units so circles are round: y% × 9/16.
    const ys = (y: number) => (y * 9) / 16;
    for (const shape of geometricShapes(false)) {
      const cx = shape.x + shape.w / 2;
      const cy = ys(shape.y + shape.h / 2);
      const nearestX = Math.min(Math.max(cx, text.left), text.right);
      const nearestY = Math.min(Math.max(cy, ys(text.top)), ys(text.bottom));
      expect(Math.hypot(cx - nearestX, cy - nearestY)).toBeGreaterThanOrEqual(shape.w / 2 - 0.5);
    }
  });

  it("Aurora puts content text on a glass card, not the cover", () => {
    const theme = slideTheme("aurora");
    const content = themedTextBox(theme, textBoxFor([]), "content");
    expect(content.card).not.toBeNull();
    expect(content.text.left).toBeGreaterThan(content.card!.left);
    expect(themedTextBox(theme, textBoxFor([]), "cover").card).toBeNull();
  });

  it("each theme's title decoration is exported", () => {
    const box = textBoxFor([]);
    expect(pptxTitleDecor(slide({}), box, slideTheme("aurora"))?.kind).toBe("gradient");
    expect(pptxTitleDecor(slide({}), box, slideTheme("paper"))?.kind).toBe("rule");
    expect(pptxTitleDecor(slide({}), box, slideTheme("graphite"))?.kind).toBe("bar");
    expect(pptxTitleDecor(slide({}), box, slideTheme("geometric"))).toBeNull();
    expect(pptxTitleDecor(slide({}), box, slideTheme("galaxy"))).toBeNull();
    expect(titleDecor(slideTheme("paper"), "thanks", "section")).toBeNull();
  });

  it("the body starts below a title underline", () => {
    const box = textBoxFor([]);
    const plain = pptxTextBlocks(slide({}), box, slideTheme("galaxy"));
    const ruled = pptxTextBlocks(slide({}), box, slideTheme("paper"));
    expect(ruled[1].box.y).toBeGreaterThan(plain[1].box.y);
    const rule = pptxTitleDecor(slide({}), box, slideTheme("paper"))!;
    expect(ruled[1].box.y).toBeGreaterThan(rule.box.y);
  });
});

describe("bullets", () => {
  it("map each marker style to pptxgenjs", () => {
    expect(pptxBullet("dot")).toBe(true);
    expect(pptxBullet("dash")).toEqual({ characterCode: "2013" });
    expect(pptxBullet("square")).toEqual({ characterCode: "25A0" });
    expect(pptxBullet("number")).toEqual({ type: "number" });
  });

  it("are coloured with the accent in the slide XML", () => {
    const xml = '<a:pPr><a:buSzPct val="100000"/><a:buChar char="■"/></a:pPr>';
    expect(colorBullets(xml, "#ff6b5a")).toBe('<a:pPr><a:buClr><a:srgbClr val="FF6B5A"/></a:buClr><a:buSzPct val="100000"/><a:buChar char="■"/></a:pPr>');
  });
});

describe("accent bars", () => {
  it("export the quote border and move column rules below a title underline", () => {
    const box = textBoxFor([]);
    const quote = slide({ layout: "quote", points: undefined, quote: { text: "ციტატა", author: "ავტორი" } });
    expect(pptxAccentBars(quote, box)).toHaveLength(1);
    const columns = slide({ layout: "two-column", columns: [{ heading: "A", text: "a" }, { heading: "B", text: "b" }] });
    expect(pptxAccentBars(columns, box, slideTheme("paper"))[0].y).toBeGreaterThan(pptxAccentBars(columns, box, slideTheme("galaxy"))[0].y);
  });
});
