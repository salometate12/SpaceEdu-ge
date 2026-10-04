import pptxgen from "pptxgenjs";
import type { GeneratedSlide } from "@/components/presentation/PresentationWizard";
import type { UploadedPhoto } from "@/lib/presentation-photos";
import { slideTheme } from "@/lib/presentation-theme";
import {
  percentToInches,
  TEXT_SIZE,
  TITLE_BAND,
  textBoxFor,
} from "@/lib/presentation-layout";

/** pptxgenjs "LAYOUT_WIDE": 13.333 × 7.5 in, 16:9 like the editor. */
export const PPTX_SLIDE_W = 13.333;
export const PPTX_SLIDE_H = 7.5;

/** A text size given as a percent of the slide width, in points. */
export function slidePercentToPoints(percent: number): number {
  return Math.round((percent / 100) * PPTX_SLIDE_W * 72 * 10) / 10;
}

const hex = (color: string) => color.replace("#", "").toUpperCase();

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
    const isCover = slide.type === "cover";

    // The same text box as on screen: it stops where the photos start.
    const textHeight = text.bottom - text.top;
    const coverSubtitle = isCover && slide.body ? slide.body : null;
    const titleHeight = isCover
      ? coverSubtitle
        ? textHeight * 0.6
        : textHeight
      : Math.min(
          Math.max(TITLE_BAND, titleHeightPercent(slide.title, text.right - text.left, TEXT_SIZE.title) + 3),
          textHeight,
        );
    const titleBox = percentToInches(
      { x: text.left, y: text.top, w: text.right - text.left, h: titleHeight },
      PPTX_SLIDE_W,
      PPTX_SLIDE_H,
    );
    s.addText(slide.title, {
      ...titleBox,
      fontSize: slidePercentToPoints(isCover ? TEXT_SIZE.coverTitle : TEXT_SIZE.title),
      bold: true,
      color: hex(theme.title),
      fontFace: "Calibri",
      valign: isCover ? (coverSubtitle ? "bottom" : "middle") : "top",
      fit: "shrink",
    });
    if (coverSubtitle) {
      s.addText(coverSubtitle, {
        ...percentToInches(
          { x: text.left, y: text.top + titleHeight, w: text.right - text.left, h: textHeight - titleHeight },
          PPTX_SLIDE_W,
          PPTX_SLIDE_H,
        ),
        fontSize: slidePercentToPoints(TEXT_SIZE.body),
        color: hex(theme.body),
        fontFace: "Calibri",
        valign: "top",
        fit: "shrink",
      });
    }

    const bodyTop = text.top + titleHeight;
    if (!isCover && text.bottom - bodyTop > 4) {
      const bodyBox = percentToInches(
        { x: text.left, y: bodyTop, w: text.right - text.left, h: text.bottom - bodyTop },
        PPTX_SLIDE_W,
        PPTX_SLIDE_H,
      );
      const bodyStyle = {
        fontSize: slidePercentToPoints(TEXT_SIZE.body),
        color: hex(theme.body),
        fontFace: "Calibri",
      };
      if (slide.points?.length) {
        s.addText(
          slide.points.map((point) => ({ text: point, options: { bullet: true, breakLine: true } })),
          { ...bodyBox, ...bodyStyle, valign: "top", paraSpaceAfter: 6, fit: "shrink" },
        );
      } else if (slide.body) {
        s.addText(slide.body, { ...bodyBox, ...bodyStyle, valign: "top", wrap: true, fit: "shrink" });
      }
    }

    for (const image of images) {
      const photo = photoById.get(image.photoId) as UploadedPhoto;
      s.addImage({ data: photo.dataUrl, ...percentToInches(image, PPTX_SLIDE_W, PPTX_SLIDE_H) });
    }
  });

  await pptx.writeFile({ fileName: `${title}.pptx` });
}
