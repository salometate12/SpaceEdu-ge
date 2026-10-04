import { describe, expect, it } from "vitest";
import {
  aspectRatio,
  assignPhotosToSlides,
  autoLayout,
  clampImage,
  percentToInches,
  resizeImage,
  snapImage,
  textBoxFor,
  type PhotoSize,
  type SlideImage,
  type SlideType,
} from "./presentation-layout";
import { slidePercentToPoints, titleHeightPercent, PPTX_SLIDE_H, PPTX_SLIDE_W } from "./exportPptx";

const landscape: PhotoSize = { id: "land", width: 1600, height: 1000 };
const landscape2: PhotoSize = { id: "land2", width: 1600, height: 900 };
const portrait: PhotoSize = { id: "port", width: 900, height: 1600 };
const square: PhotoSize = { id: "sq", width: 1000, height: 1000 };

const TYPES: SlideType[] = ["cover", "content", "image", "stats", "conclusion"];

/** The image's own width ÷ height in real slide units (16:9). */
const shownRatio = (img: SlideImage) => (img.w * 16) / (img.h * 9);

function overlaps(a: { left: number; top: number; right: number; bottom: number }, img: SlideImage) {
  return a.left < img.x + img.w && img.x < a.right && a.top < img.y + img.h && img.y < a.bottom;
}

describe("autoLayout", () => {
  const cases: PhotoSize[][] = [[landscape], [portrait], [square], [landscape, portrait], [landscape, landscape2]];

  for (const type of TYPES) {
    for (const photos of cases) {
      it(`${type} with ${photos.map((p) => p.id).join("+")}: on the slide, unstretched, clear of the text`, () => {
        const images = autoLayout({ type }, photos);
        expect(images).toHaveLength(photos.length);
        images.forEach((img, i) => {
          expect(img.photoId).toBe(photos[i].id);
          expect(img.x).toBeGreaterThanOrEqual(0);
          expect(img.y).toBeGreaterThanOrEqual(0);
          expect(img.x + img.w).toBeLessThanOrEqual(100.01);
          expect(img.y + img.h).toBeLessThanOrEqual(100.01);
          expect(shownRatio(img)).toBeCloseTo(aspectRatio(photos[i]), 1);
        });
        // Photos don't overlap each other…
        if (images.length === 2) {
          const [a, b] = images;
          expect(overlaps({ left: a.x, top: a.y, right: a.x + a.w, bottom: a.y + a.h }, b)).toBe(false);
        }
        // …and the text box stops before every photo.
        const text = textBoxFor(images);
        for (const img of images) expect(overlaps(text, img)).toBe(false);
      });
    }
  }

  it("puts a single photo on the right of a text slide, vertically centred", () => {
    const [img] = autoLayout({ type: "content" }, [landscape]);
    expect(img.x).toBeGreaterThan(50);
    expect(textBoxFor([img]).right).toBeLessThan(img.x);
    const centre = img.y + img.h / 2;
    expect(centre).toBeGreaterThan(45);
    expect(centre).toBeLessThan(60);
  });

  it("gives an image slide one big photo under the title", () => {
    const [img] = autoLayout({ type: "image" }, [landscape]);
    expect(img.w).toBeGreaterThan(55);
    expect(img.y).toBeGreaterThan(15);
  });

  it("stacks two photos on the right, or lays two wide ones along the bottom", () => {
    const mixed = autoLayout({ type: "content" }, [landscape, portrait]);
    expect(mixed.every((img) => img.x > 50)).toBe(true);
    expect(mixed[1].y).toBeGreaterThan(mixed[0].y);
    const wide = autoLayout({ type: "content" }, [landscape, landscape2]);
    expect(wide.every((img) => img.y > 45)).toBe(true);
    expect(wide[1].x).toBeGreaterThan(wide[0].x);
  });

  it("leaves a slide without photos empty", () => {
    expect(autoLayout({ type: "content" }, [])).toEqual([]);
    expect(textBoxFor([])).toEqual({ left: 5, top: 7, right: 95, bottom: 93 });
  });
});

describe("moving and resizing", () => {
  const img: SlideImage = { photoId: "a", x: 60, y: 20, w: 30, h: 40 };

  it("keeps a photo on the slide", () => {
    expect(clampImage({ ...img, x: 90, y: -5 })).toMatchObject({ x: 70, y: 0 });
  });

  it("snaps to the margin, the edge and the centre", () => {
    expect(snapImage({ ...img, x: 64.2 }).x).toBe(65); // right margin: 100 - 5 - 30
    expect(snapImage({ ...img, x: 34.5 }).x).toBe(35); // centred: 50 - 15
    expect(snapImage({ ...img, x: 60 }).x).toBe(60); // nothing near
  });

  it("resizes from a corner keeping the ratio and the opposite corner", () => {
    const ratio = shownRatio(img);
    const bigger = resizeImage(img, ratio, "nw", 34);
    expect(bigger.x + bigger.w).toBeCloseTo(img.x + img.w, 1);
    expect(bigger.y + bigger.h).toBeCloseTo(img.y + img.h, 1);
    expect(shownRatio(bigger)).toBeCloseTo(ratio, 1);
    // Can't grow past the slide edge.
    const capped = resizeImage(img, ratio, "se", 90);
    expect(capped.x + capped.w).toBeLessThanOrEqual(100);
    expect(capped.y + capped.h).toBeLessThanOrEqual(100.01);
  });
});

describe("assignPhotosToSlides (cleaning the AI's choices)", () => {
  const photos = [landscape, portrait, square];
  const deck = (photoIds: (string[] | null)[]) =>
    (["cover", "content", "content", "image", "conclusion"] as SlideType[]).map((type, i) => ({
      type,
      photoIds: photoIds[i] ?? null,
    }));

  const ids = (layout: SlideImage[][]) => layout.map((images) => images.map((img) => img.photoId));

  it("drops unknown ids", () => {
    expect(ids(assignPhotosToSlides(deck([null, ["made-up", "land"]]), [landscape]))).toEqual([
      [],
      ["land"],
      [],
      [],
      [],
    ]);
  });

  it("keeps a photo picked twice on its first slide only", () => {
    const layout = ids(assignPhotosToSlides(deck([null, ["land"], ["land"], null]), [landscape]));
    expect(layout).toEqual([[], ["land"], [], [], []]);
  });

  it("caps a slide at two photos", () => {
    const layout = ids(assignPhotosToSlides(deck([null, ["land", "port", "sq"]]), photos));
    expect(layout[1]).toEqual(["land", "port"]);
  });

  it("puts photos the AI skipped on the first text/image slides without one", () => {
    const layout = ids(assignPhotosToSlides(deck([null, ["land"]]), photos));
    expect(layout).toEqual([[], ["land"], ["port"], ["sq"], []]);
  });

  it("leaves photos on the shelf when no slide is free", () => {
    const tiny = [
      { type: "cover" as const, photoIds: null },
      { type: "content" as const, photoIds: ["land"] },
    ];
    const layout = ids(assignPhotosToSlides(tiny, photos));
    expect(layout.flat()).toEqual(["land"]);
  });
});

describe("PPTX units", () => {
  it("converts percentages to inches on the wide layout", () => {
    expect(percentToInches({ x: 50, y: 50, w: 25, h: 40 }, PPTX_SLIDE_W, PPTX_SLIDE_H)).toEqual({
      x: 6.667,
      y: 3.75,
      w: 3.333,
      h: 3,
    });
    expect(percentToInches({ x: 0, y: 0, w: 100, h: 100 }, 10, 5.625)).toEqual({ x: 0, y: 0, w: 10, h: 5.625 });
  });

  it("makes room for a title that wraps in a narrowed text box", () => {
    const short = titleHeightPercent("მზე", 52, 3.6);
    const long = titleHeightPercent("გაზის გიგანტები: იუპიტერი, სატურნი, ურანი, ნეპტუნი", 52, 3.6);
    expect(long).toBeGreaterThan(short * 1.9);
  });

  it("turns text sizes given in slide width percent into points", () => {
    expect(slidePercentToPoints(3.6)).toBeCloseTo(34.6, 1);
  });
});
