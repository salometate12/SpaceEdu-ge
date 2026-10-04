import pptxgen from "pptxgenjs";
import type { GeneratedSlide } from "@/components/presentation/PresentationWizard";
import type { UploadedPhoto } from "@/lib/presentation-photos";
import { slideTheme } from "@/lib/presentation-theme";
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
export function pptxAccentBars(slide: GeneratedSlide, text: TextBox): { x: number; y: number; w: number; h: number }[] {
  const width = text.right - text.left;
  const layout = effectiveLayout(slide);
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
    const titleH = Math.min(Math.max(TITLE_BAND, titleHeightPercent(slide.title, width, TEXT_SIZE.title) + 3), text.bottom - text.top);
    const colW = (width - 3) / 2;
    return slide.columns.slice(0, 2).map((_, index) => ({ x: text.left + index * (colW + 3), y: text.top + titleH, w: colW, h: 0.4 }));
  }
  return [];
}

/**
 * A slide's text as PPTX text boxes, in percent of the slide — the same
 * structure SlideCard draws for each layout, inside the same text box (which
 * already stops where photos start).
 */
export function pptxTextBlocks(slide: GeneratedSlide, text: TextBox): TextBlock[] {
  const width = text.right - text.left;
  const height = text.bottom - text.top;
  const box = (y: number, h: number, x = text.left, w = width) => ({ x, y, w, h: Math.max(h, 2) });
  const layout = effectiveLayout(slide);

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
      { box: box(text.top, titleH), runs: [{ text: slide.title, size: big, tone: "title", bold: true }], valign: slide.body ? "bottom" : "middle" },
    ];
    if (slide.body) {
      blocks.push({ box: box(text.top + titleH, height - titleH), runs: [{ text: slide.body, size: slide.type === "cover" ? TEXT_SIZE.body : TEXT_SIZE.prose, tone: "body" }] });
    }
    return blocks;
  }

  const titleH = Math.min(Math.max(TITLE_BAND, titleHeightPercent(slide.title, width, TEXT_SIZE.title) + 3), height);
  const blocks: TextBlock[] = [{ box: box(text.top, titleH), runs: [{ text: slide.title, size: TEXT_SIZE.title, tone: "title", bold: true }] }];
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
) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  const theme = slideTheme(template);
  const photoById = new Map(photos.map((photo) => [photo.id, photo]));

  slides.forEach((slide) => {
    const s = pptx.addSlide();
    s.background = { color: hex(theme.bg) };

    const images = slide.images.filter((image) => photoById.has(image.photoId));
    const text = textBoxFor(images);

    for (const bar of pptxAccentBars(slide, text)) {
      s.addShape(pptx.ShapeType.rect, {
        ...percentToInches(bar, PPTX_SLIDE_W, PPTX_SLIDE_H),
        fill: { color: hex(theme.accent) },
        line: { color: hex(theme.accent), width: 0 },
      });
    }

    for (const block of pptxTextBlocks(slide, text)) {
      s.addText(
        block.runs.map((run) => ({
          text: run.text,
          options: {
            bold: run.bold,
            italic: run.italic,
            bullet: run.bullet,
            breakLine: run.breakLine,
            color: hex(run.tone === "title" ? theme.title : run.tone === "accent" ? theme.accent : theme.body),
            fontSize: slidePercentToPoints(run.size),
          },
        })),
        {
          ...percentToInches(block.box, PPTX_SLIDE_W, PPTX_SLIDE_H),
          fontFace: "Calibri",
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
      s.addImage({ data: photo.dataUrl, ...percentToInches(image, PPTX_SLIDE_W, PPTX_SLIDE_H) });
    }
  });

  await pptx.writeFile({ fileName: `${title}.pptx` });
}
