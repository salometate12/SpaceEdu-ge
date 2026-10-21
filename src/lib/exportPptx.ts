import pptxgen from "pptxgenjs";
import type { GeneratedSlide } from "@/lib/presentation-types";
import type { UploadedPhoto } from "@/lib/presentation-photos";
import JSZip from "jszip";
import { auroraBackground, auroraLine, geometricShapes } from "@/lib/presentation-decor";
import {
  BAR,
  PAPER_RULE,
  slideTheme,
  themedTextBox,
  titleDecor,
  type BulletStyle,
  type SlideTheme,
} from "@/lib/presentation-theme";
import {
  percentToInches,
  TEXT_SIZE,
  TITLE_BAND,
  keyFigureSize,
  textBoxFor,
  type TextBox,
} from "@/lib/presentation-layout";
import { effectiveLayout } from "@/lib/presentation-style";

/** pptxgenjs "LAYOUT_WIDE": 13.333 × 7.5 in, 16:9 like the editor. */
export const PPTX_SLIDE_W = 13.333;
export const PPTX_SLIDE_H = 7.5;

/** A text size given as a percent of the slide width, in points. */
export function slidePercentToPoints(percent: number): number {
  return Math.round((percent / 100) * PPTX_SLIDE_W * 72 * 10) / 10;
}

const hex = (color: string) => color.replace("#", "").toUpperCase();

export interface TextRun {
  text: string;
  size: number;
  tone: "title" | "body" | "accent";
  bold?: boolean;
  italic?: boolean;
  bullet?: boolean;
  breakLine?: boolean;
}

export interface TextBlock {
  box: { x: number; y: number; w: number; h: number };
  runs: TextRun[];
  align?: "left" | "center";
  valign?: "top" | "middle" | "bottom";
  paraSpaceAfter?: number;
}

/**
 * The small accent bars SlideCard draws (above a section title, under the
 * thank-you title, on top of each column), as rectangles in percent.
 */
export function pptxAccentBars(
  slide: GeneratedSlide,
  text: TextBox,
  theme?: SlideTheme,
): { x: number; y: number; w: number; h: number }[] {
  const width = text.right - text.left;
  const layout = effectiveLayout(slide);
  // Below a title underline (Aurora, Paper) everything sits a little lower, as in pptxTextBlocks.
  const decor = theme ? titleDecor(theme, slide.type, layout) : null;
  const decorGap = decor === "gradient" || decor === "rule" ? 3 : 0;
  if (slide.type === "thanks") {
    const mid = text.top + (text.bottom - text.top) / 2;
    return [{ x: text.left + width / 2 - 4, y: mid + 4.5, w: 8, h: 0.5 }];
  }
  if (slide.type !== "cover" && layout === "section") {
    const height = text.bottom - text.top;
    const titleH = slide.body ? height * 0.6 : height;
    return [{ x: text.left, y: text.top + titleH / 2 - 10, w: 6, h: 0.6 }];
  }
  if (layout === "two-column" && slide.columns?.length) {
    const titleH = Math.min(Math.max(TITLE_BAND, titleHeightPercent(slide.title, width, TEXT_SIZE.title) + 3) + decorGap, text.bottom - text.top);
    const colW = (width - 3) / 2;
    return slide.columns.slice(0, 2).map((_, index) => ({ x: text.left + index * (colW + 3), y: text.top + titleH, w: colW, h: 0.4 }));
  }
  if (layout === "quote" && slide.quote) {
    // The border left of the quote (and its author), as tall as the text.
    const titleH = Math.min(Math.max(TITLE_BAND, titleHeightPercent(slide.title, width, TEXT_SIZE.title) + 3) + decorGap, text.bottom - text.top);
    const quoteH = titleHeightPercent(`„${slide.quote.text}“`, width - 2, TEXT_SIZE.quote) + (slide.quote.author ? 5 : 0);
    return [{ x: text.left, y: text.top + titleH + 1, w: 0.4, h: Math.min(quoteH + 1, text.bottom - text.top - titleH - 1) }];
  }
  return [];
}

/**
 * A slide's text as PPTX text boxes, in percent of the slide — the same
 * structure SlideCard draws for each layout, inside the same text box (which
 * already stops where photos start).
 */
export function pptxTextBlocks(slide: GeneratedSlide, text: TextBox, theme?: SlideTheme): TextBlock[] {
  const width = text.right - text.left;
  const height = text.bottom - text.top;
  const box = (y: number, h: number, x = text.left, w = width) => ({ x, y, w, h: Math.max(h, 2) });
  const layout = effectiveLayout(slide);
  // A line under the title (Aurora, Paper) pushes the text below it down.
  const decor = theme ? titleDecor(theme, slide.type, layout) : null;
  const decorGap = decor === "gradient" || decor === "rule" ? 3 : 0;
  const titleAlign = theme?.titleAlign;

  if (slide.type === "thanks") {
    // Title (and subtitle) above the middle, the accent bar, then the
    // footnote below it — see pptxAccentBars.
    const half = height / 2;
    const runs: TextRun[] = [{ text: slide.title, size: TEXT_SIZE.coverTitle, tone: "title", bold: true, breakLine: Boolean(slide.body) }];
    if (slide.body) runs.push({ text: slide.body, size: TEXT_SIZE.prose, tone: "body" });
    const blocks: TextBlock[] = [{ box: box(text.top, half + 2), runs, align: "center", valign: "bottom", paraSpaceAfter: 8 }];
    if (slide.footnote) {
      blocks.push({ box: box(text.top + half + 7, half - 7), runs: [{ text: slide.footnote, size: TEXT_SIZE.footnote, tone: "body" }], align: "center", valign: "top" });
    }
    return blocks;
  }

  if (slide.type === "cover" || layout === "section") {
    const big = slide.type === "cover" ? TEXT_SIZE.coverTitle : TEXT_SIZE.sectionTitle;
    const titleH = slide.body ? height * 0.6 : height;
    const blocks: TextBlock[] = [
      {
        box: box(text.top, titleH),
        runs: [{ text: slide.title, size: big, tone: "title", bold: true }],
        valign: slide.body ? "bottom" : "middle",
        align: titleAlign,
      },
    ];
    if (slide.body) {
      blocks.push({
        box: box(text.top + titleH + decorGap, height - titleH - decorGap),
        runs: [{ text: slide.body, size: slide.type === "cover" ? TEXT_SIZE.body : TEXT_SIZE.prose, tone: "body" }],
      });
    }
    return blocks;
  }

  const titleH = Math.min(Math.max(TITLE_BAND, titleHeightPercent(slide.title, width, TEXT_SIZE.title) + 3) + decorGap, height);
  const blocks: TextBlock[] = [
    { box: box(text.top, titleH - decorGap), runs: [{ text: slide.title, size: TEXT_SIZE.title, tone: "title", bold: true }], align: titleAlign },
  ];
  const top = text.top + titleH;
  const rest = text.bottom - top;
  if (rest <= 4) return blocks;

  if (layout === "bullets" && slide.points?.length) {
    blocks.push({
      box: box(top, rest),
      runs: slide.points.map((point) => ({ text: point, size: TEXT_SIZE.body, tone: "body" as const, bullet: true, breakLine: true })),
      paraSpaceAfter: 6,
    });
  } else if (layout === "two-column" && slide.columns?.length) {
    const gap = 3;
    const colW = (width - gap) / 2;
    slide.columns.slice(0, 2).forEach((column, index) => {
      blocks.push({
        box: box(top + 1, rest - 1, text.left + index * (colW + gap), colW),
        runs: [
          { text: column.heading, size: TEXT_SIZE.column + 0.25, tone: "title", bold: true, breakLine: true },
          { text: column.text, size: TEXT_SIZE.column, tone: "body" },
        ],
        paraSpaceAfter: 6,
      });
    });
  } else if (layout === "quote" && slide.quote) {
    const runs: TextRun[] = [{ text: `„${slide.quote.text}“`, size: TEXT_SIZE.quote, tone: "title", italic: true, breakLine: Boolean(slide.quote.author) }];
    if (slide.quote.author) runs.push({ text: slide.quote.author, size: TEXT_SIZE.body, tone: "body" });
    blocks.push({ box: box(top + 1, rest - 1, text.left + 2, width - 2), runs, paraSpaceAfter: 8 });
  } else if (layout === "key-figure" && slide.figure) {
    const figureH = Math.min(22, rest * 0.5);
    blocks.push({ box: box(top, figureH), runs: [{ text: slide.figure.value, size: keyFigureSize(slide.figure.value), tone: "accent", bold: true }], valign: "middle" });
    blocks.push({ box: box(top + figureH, rest - figureH), runs: [{ text: slide.figure.caption, size: TEXT_SIZE.prose, tone: "body" }] });
  } else {
    const prose = slide.body ?? slide.points?.join(" ");
    if (prose) blocks.push({ box: box(top, rest), runs: [{ text: prose, size: TEXT_SIZE.prose, tone: "body" }] });
  }
  return blocks;
}

/** h% of the slide for a size given in % of its width (cqw on screen). */
const widthToHeight = (value: number) => (value * 16) / 9;

/**
 * The line or bar a theme draws with the title (see SlideCard): Aurora's
 * gradient underline, Paper's rule, Graphite's bar left of it.
 */
export function pptxTitleDecor(
  slide: GeneratedSlide,
  text: TextBox,
  theme: SlideTheme,
): { kind: "gradient" | "rule" | "bar"; box: { x: number; y: number; w: number; h: number } } | null {
  const decor = titleDecor(theme, slide.type, effectiveLayout(slide));
  if (!decor) return null;
  const width = text.right - text.left;
  if (decor === "bar") {
    return { kind: "bar", box: { x: text.left - BAR.offset, y: text.top + widthToHeight(BAR.top), w: BAR.w, h: widthToHeight(BAR.h) } };
  }
  let titleBottom: number;
  if (slide.type === "cover") {
    const height = text.bottom - text.top;
    const titleH = slide.body ? height * 0.6 : height;
    titleBottom = slide.body
      ? text.top + titleH
      : text.top + height / 2 + titleHeightPercent(slide.title, width, TEXT_SIZE.coverTitle) / 2;
  } else {
    titleBottom = text.top + titleHeightPercent(slide.title, width, TEXT_SIZE.title);
  }
  return decor === "gradient"
    ? { kind: "gradient", box: { x: text.left, y: titleBottom + 1.3, w: 9, h: widthToHeight(0.35) } }
    : { kind: "rule", box: { x: text.left, y: titleBottom + 1.5, w: width, h: 0.18 } };
}

/** pptxgenjs bullet options for a theme's marker. */
export function pptxBullet(style: BulletStyle | undefined): true | { characterCode: string } | { type: "number" } {
  if (style === "dash") return { characterCode: "2013" };
  if (style === "square") return { characterCode: "25A0" };
  if (style === "number") return { type: "number" };
  return true;
}

/**
 * Colours the bullet markers with the accent, as on screen. pptxgenjs has
 * no option for it, so the slide XML gets a <a:buClr> before each marker's
 * size (the order the schema wants).
 */
export function colorBullets(xml: string, color: string): string {
  return xml.replaceAll('<a:buSzPct val="100000"/>', `<a:buClr><a:srgbClr val="${hex(color)}"/></a:buClr><a:buSzPct val="100000"/>`);
}

/**
 * How tall (in % of the slide) a title of this length gets in a box this
 * wide. A PPTX text box doesn't push the next one down the way the HTML
 * slide flows, so the body has to start below the title's real height.
 * Georgian glyphs average ~0.6 em wide.
 */
export function titleHeightPercent(title: string, boxWidthPercent: number, fontPercent: number): number {
  const fontPt = slidePercentToPoints(fontPercent);
  const boxPt = (boxWidthPercent / 100) * PPTX_SLIDE_W * 72;
  const charsPerLine = Math.max(8, Math.floor(boxPt / (fontPt * 0.6)));
  const lines = Math.min(3, Math.max(1, Math.ceil(title.length / charsPerLine)));
  return ((lines * fontPt * 1.2) / (PPTX_SLIDE_H * 72)) * 100;
}

export async function exportToPptx(
  slides: GeneratedSlide[],
  template: string,
  title: string,
  photos: UploadedPhoto[] = [],
  /** Per slide: how much the editor shrank the text to fit (1 = not at all). */
  fitScales: number[] = [],
) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  const theme = slideTheme(template);
  const photoById = new Map(photos.map((photo) => [photo.id, photo]));
  const inches = (box: { x: number; y: number; w: number; h: number }) => percentToInches(box, PPTX_SLIDE_W, PPTX_SLIDE_H);
  const noLine = { type: "none" as const };
  const detail = hex(theme.detail ?? theme.accent);
  const aurora = theme.decor === "aurora" ? auroraBackground() : null;
  const gradientLine = theme.decor === "aurora" ? auroraLine() : null;

  slides.forEach((slide, slideIndex) => {
    const fit = fitScales[slideIndex] ?? 1;
    const s = pptx.addSlide();
    s.background = aurora ? { data: aurora } : { color: hex(theme.bg) };

    const images = slide.images.filter((image) => photoById.has(image.photoId));
    const { text, card } = themedTextBox(theme, textBoxFor(images), slide.type);

    if (theme.decor === "geometric") {
      for (const shape of geometricShapes(slide.type === "cover" || slide.type === "thanks")) {
        s.addShape(shape.kind === "ellipse" ? pptx.ShapeType.ellipse : pptx.ShapeType.rect, {
          ...inches(shape),
          fill: { color: hex(shape.color), transparency: Math.round((1 - shape.opacity) * 100) },
          line: noLine,
        });
      }
    }
    if (card) {
      s.addShape(pptx.ShapeType.roundRect, {
        ...inches({ x: card.left, y: card.top, w: card.right - card.left, h: card.bottom - card.top }),
        rectRadius: 0.18,
        fill: { color: "FFFFFF", transparency: 94 },
        line: { color: "FFFFFF", transparency: 86, width: 0.75 },
      });
    }

    for (const bar of pptxAccentBars(slide, text, theme)) {
      if (gradientLine && slide.type === "thanks") s.addImage({ data: gradientLine, ...inches(bar) });
      else s.addShape(pptx.ShapeType.rect, { ...inches(bar), fill: { color: detail }, line: noLine });
    }
    const decor = pptxTitleDecor(slide, text, theme);
    if (decor?.kind === "gradient" && gradientLine) s.addImage({ data: gradientLine, ...inches(decor.box) });
    else if (decor?.kind === "rule") s.addShape(pptx.ShapeType.rect, { ...inches(decor.box), fill: { color: hex(PAPER_RULE) }, line: noLine });
    else if (decor?.kind === "bar") s.addShape(pptx.ShapeType.roundRect, { ...inches(decor.box), rectRadius: 0.03, fill: { color: hex(theme.accent) }, line: noLine });

    for (const block of pptxTextBlocks(slide, text, theme)) {
      s.addText(
        block.runs.map((run) => ({
          text: run.text,
          options: {
            bold: run.bold,
            italic: run.italic,
            bullet: run.bullet ? pptxBullet(theme.bulletStyle) : undefined,
            breakLine: run.breakLine,
            color: hex(
              run.tone === "title" ? theme.title : run.tone === "accent" ? (theme.figure ?? theme.accent) : theme.body,
            ),
            fontFace: run.tone === "body" ? (theme.pptxFontBody ?? "Calibri") : (theme.pptxFontTitle ?? "Calibri"),
            fontSize: Math.round(slidePercentToPoints(run.size) * fit * 10) / 10,
          },
        })),
        {
          ...inches(block.box),
          fontFace: theme.pptxFontBody ?? "Calibri",
          align: block.align ?? "left",
          valign: block.valign ?? "top",
          paraSpaceAfter: block.paraSpaceAfter,
          fit: "shrink",
          wrap: true,
        },
      );
    }

    for (const image of images) {
      const photo = photoById.get(image.photoId) as UploadedPhoto;
      s.addImage({ data: photo.dataUrl, ...inches(image) });
    }

    if (theme.slideNumber && slide.type !== "cover") {
      s.addText(String(slideIndex + 1).padStart(2, "0"), {
        ...inches({ x: 100 - 3.2 - 8, y: 100 - 3.4 - 4, w: 8, h: 4 }),
        align: "right",
        valign: "bottom",
        bold: true,
        color: hex(theme.accent),
        fontFace: theme.pptxFontBody ?? "Calibri",
        fontSize: slidePercentToPoints(TEXT_SIZE.footnote * 0.8),
        margin: 0,
      });
    }
  });

  // Colour the bullet markers, then download.
  const zip = await JSZip.loadAsync((await pptx.write({ outputType: "arraybuffer" })) as ArrayBuffer);
  await Promise.all(
    Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .map(async (name) => zip.file(name, colorBullets(await zip.file(name)!.async("string"), theme.accent))),
  );
  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    compression: "DEFLATE",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title}.pptx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
