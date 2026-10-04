/**
 * Where photos sit on a 16:9 slide. Every position is a percentage of the
 * slide (x/w of its width, y/h of its height), so the editor, the PDF
 * capture and the PPTX export all place a photo identically.
 */

export interface SlideImage {
  photoId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type SlideType = "cover" | "content" | "image" | "stats" | "conclusion" | "thanks";

/** The part of a photo the layout needs. */
export interface PhotoSize {
  id: string;
  width: number;
  height: number;
}

/** Slide proportions in arbitrary units (16:9). */
const SLIDE_W = 16;
const SLIDE_H = 9;

/** Outer margins, in percent of the slide. */
export const MARGIN_X = 5;
export const MARGIN_Y = 7;
/** Gap between photos, and between a photo and the text. */
const GAP = 3;

/** Text sizes as a percent of the slide width — shared by the editor
 * (CSS `cqw`) and the PPTX export (points), so both read alike. */
export const TEXT_SIZE = {
  coverTitle: 5.4,
  title: 3.6,
  body: 2.05,
  prose: 2.25,
  column: 1.95,
  quote: 2.8,
  figure: 8,
  sectionTitle: 4.6,
  footnote: 1.6,
} as const;

/** A key figure is big when it's a short number and shrinks as it grows
 * (e.g. a „[მონაცემი მიუთითე]“ placeholder), so it never runs into its
 * caption. Percent of the slide width, like TEXT_SIZE. */
export function keyFigureSize(value: string): number {
  const length = value.trim().length;
  if (length <= 6) return TEXT_SIZE.figure;
  if (length <= 12) return 6;
  return 4.2;
}

/** Height of the title line on a regular slide, in percent. */
export const TITLE_BAND = 15;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const round = (value: number) => Math.round(value * 100) / 100;

/** Photo width ÷ height. */
export function aspectRatio(photo: Pick<PhotoSize, "width" | "height">): number {
  return photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 4 / 3;
}

/** h% for a w%-wide photo of this ratio, so it isn't stretched. */
export function heightForWidth(w: number, ratio: number): number {
  return (w * SLIDE_W) / (SLIDE_H * ratio);
}

/** Largest box of this ratio that fits in `region`, centred in it. */
function fitInto(region: Box, ratio: number): Box {
  const regionW = (region.w * SLIDE_W) / 100;
  const regionH = (region.h * SLIDE_H) / 100;
  let w = regionW;
  let h = w / ratio;
  if (h > regionH) {
    h = regionH;
    w = h * ratio;
  }
  const wPct = (w / SLIDE_W) * 100;
  const hPct = (h / SLIDE_H) * 100;
  return {
    x: region.x + (region.w - wPct) / 2,
    y: region.y + (region.h - hPct) / 2,
    w: wPct,
    h: hPct,
  };
}

/** Splits a region into `count` equal cells, stacked or side by side. */
function split(region: Box, count: number, direction: "vertical" | "horizontal"): Box[] {
  const cells: Box[] = [];
  if (direction === "vertical") {
    const h = (region.h - GAP * (count - 1)) / count;
    for (let i = 0; i < count; i += 1) cells.push({ ...region, y: region.y + i * (h + GAP), h });
  } else {
    const w = (region.w - GAP * (count - 1)) / count;
    for (let i = 0; i < count; i += 1) cells.push({ ...region, x: region.x + i * (w + GAP), w });
  }
  return cells;
}

const isLandscape = (photo: PhotoSize) => aspectRatio(photo) >= 1.2;

/** The regions photos go into, by slide type and photo count. */
function photoCells(type: SlideType, photos: PhotoSize[]): Box[] {
  const count = photos.length;
  const bottom = 100 - MARGIN_Y;

  if (type === "image") {
    // Big photo(s) under the title.
    const region = { x: 8, y: MARGIN_Y + TITLE_BAND + 2, w: 84, h: bottom - (MARGIN_Y + TITLE_BAND + 2) };
    return count === 1 ? [region] : split(region, count, "horizontal");
  }

  if (type === "cover") {
    // The right half; the title keeps the left.
    const region = { x: 52, y: 10, w: 100 - MARGIN_X - 52, h: 80 };
    return count === 1 ? [region] : split(region, count, "vertical");
  }

  // content / stats / conclusion
  if (count >= 2 && photos.every(isLandscape)) {
    // Wide photos read better side by side along the bottom.
    const region = { x: MARGIN_X, y: 52, w: 100 - 2 * MARGIN_X, h: bottom - 52 };
    return split(region, count, "horizontal");
  }
  const region = { x: 57, y: MARGIN_Y + TITLE_BAND - 4, w: 100 - MARGIN_X - 57, h: bottom - (MARGIN_Y + TITLE_BAND - 4) };
  return count === 1 ? [region] : split(region, count, "vertical");
}

/**
 * Places the given photos on a slide: text on the left and photos on the
 * right for a text slide, one big photo for an image slide, the right half
 * for the cover. Photos keep their proportions.
 */
export function autoLayout(slide: { type: SlideType }, photos: PhotoSize[]): SlideImage[] {
  if (photos.length === 0) return [];
  const cells = photoCells(slide.type, photos);
  return photos.map((photo, index) => {
    const box = fitInto(cells[index], aspectRatio(photo));
    return { photoId: photo.id, x: round(box.x), y: round(box.y), w: round(box.w), h: round(box.h) };
  });
}

export interface TextBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Where the slide's text may go so it never sits under a photo: left of
 * photos on the right, above photos along the bottom, right of photos on
 * the left. Edges are percentages measured from the slide's left/top.
 */
export function textBoxFor(images: SlideImage[]): TextBox {
  const box: TextBox = { left: MARGIN_X, top: MARGIN_Y, right: 100 - MARGIN_X, bottom: 100 - MARGIN_Y };
  if (images.length === 0) return box;

  const minX = Math.min(...images.map((img) => img.x));
  const maxRight = Math.max(...images.map((img) => img.x + img.w));
  const minY = Math.min(...images.map((img) => img.y));

  if (minX >= 35) {
    box.right = Math.max(box.left + 15, minX - GAP);
  } else if (maxRight <= 65) {
    box.left = Math.min(box.right - 15, maxRight + GAP);
  } else if (minY >= 30) {
    box.bottom = Math.max(box.top + 10, minY - GAP);
  } else {
    // A photo across the middle: keep only the title band above it.
    box.bottom = Math.max(box.top + 8, minY - 1);
  }
  return {
    left: round(box.left),
    top: round(box.top),
    right: round(box.right),
    bottom: round(box.bottom),
  };
}

/** Keeps a photo fully on the slide. */
export function clampImage(image: SlideImage): SlideImage {
  const w = Math.min(Math.max(image.w, 1), 100);
  const h = Math.min(Math.max(image.h, 1), 100);
  return {
    ...image,
    w,
    h,
    x: round(Math.min(Math.max(image.x, 0), 100 - w)),
    y: round(Math.min(Math.max(image.y, 0), 100 - h)),
  };
}

/** Within this many percent, a dragged photo clicks onto a guide. */
export const SNAP_THRESHOLD = 1.5;

function snapAxis(start: number, size: number, margin: number): number {
  const guides = [0, margin, 50 - size / 2, 100 - margin - size, 100 - size];
  let best = start;
  let bestDistance = SNAP_THRESHOLD;
  for (const guide of guides) {
    const distance = Math.abs(start - guide);
    if (distance < bestDistance) {
      best = guide;
      bestDistance = distance;
    }
  }
  return best;
}

/** Light snapping to the slide edges, the margins and the centre. */
export function snapImage(image: SlideImage): SlideImage {
  return {
    ...image,
    x: round(snapAxis(image.x, image.w, MARGIN_X)),
    y: round(snapAxis(image.y, image.h, MARGIN_Y)),
  };
}

/** Resizes from a corner, keeping proportions and the opposite corner put. */
export function resizeImage(
  image: SlideImage,
  ratio: number,
  corner: "nw" | "ne" | "sw" | "se",
  newWidth: number,
): SlideImage {
  const minW = 8;
  const right = image.x + image.w;
  const bottom = image.y + image.h;
  // The room on the side we grow towards caps the width (and, via the
  // ratio, the height).
  const roomX = corner.includes("w") ? right : 100 - image.x;
  const roomY = corner.startsWith("n") ? bottom : 100 - image.y;
  const maxW = Math.min(roomX, (roomY * SLIDE_H * ratio) / SLIDE_W);
  const w = Math.min(Math.max(newWidth, minW), maxW);
  const h = heightForWidth(w, ratio);
  return {
    ...image,
    w: round(w),
    h: round(h),
    x: round(corner.includes("w") ? right - w : image.x),
    y: round(corner.startsWith("n") ? bottom - h : image.y),
  };
}

export interface InchBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A percentage box on a slide of the given size in inches. */
export function percentToInches(box: Pick<SlideImage, "x" | "y" | "w" | "h">, slideW: number, slideH: number): InchBox {
  const inches = (pct: number, total: number) => Math.round((pct / 100) * total * 1000) / 1000;
  return {
    x: inches(box.x, slideW),
    y: inches(box.y, slideH),
    w: inches(box.w, slideW),
    h: inches(box.h, slideH),
  };
}

export interface SlidePhotoChoice {
  type: SlideType;
  photoIds?: string[] | null;
}

/** At most this many photos land on one slide automatically. */
export const MAX_PHOTOS_PER_SLIDE = 2;

/**
 * Turns the AI's photo choices into placed images. Unknown ids are dropped,
 * a photo picked twice stays on its first slide, and a photo the AI didn't
 * use goes to the first text or image slide that has none yet. Anything
 * still left over isn't on a slide, i.e. it's on the photo shelf.
 */
export function assignPhotosToSlides(
  slides: SlidePhotoChoice[],
  photos: PhotoSize[],
): SlideImage[][] {
  const byId = new Map(photos.map((photo) => [photo.id, photo]));
  const used = new Set<string>();

  const chosen = slides.map((slide) => {
    const ids: string[] = [];
    for (const id of slide.photoIds ?? []) {
      if (!byId.has(id) || used.has(id) || ids.length >= MAX_PHOTOS_PER_SLIDE) continue;
      ids.push(id);
      used.add(id);
    }
    return ids;
  });

  for (const photo of photos) {
    if (used.has(photo.id)) continue;
    const target = slides.findIndex(
      (slide, index) => (slide.type === "content" || slide.type === "image") && chosen[index].length === 0,
    );
    if (target === -1) break;
    chosen[target].push(photo.id);
    used.add(photo.id);
  }

  return slides.map((slide, index) =>
    autoLayout(slide, chosen[index].map((id) => byId.get(id) as PhotoSize)),
  );
}
