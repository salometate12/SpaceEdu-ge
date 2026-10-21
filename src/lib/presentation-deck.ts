/**
 * Editing a deck: slides added, duplicated, moved, re-laid-out. Pure, so
 * the editor, the undo history and the tests share it.
 */

import type { SlideLayout } from "@/lib/presentation-constants";
import { effectiveLayout, pointsToProse, thanksSlide, type DeckLanguage } from "@/lib/presentation-style";
import type { GeneratedSlide } from "@/lib/presentation-types";

/** What „+ ახალი სლაიდი“ offers: the text layouts, a photo slide and a thank-you slide. */
export const NEW_SLIDE_KINDS = [
  "prose",
  "bullets",
  "two-column",
  "image",
  "quote",
  "key-figure",
  "section",
  "thanks",
] as const;
export type NewSlideKind = (typeof NEW_SLIDE_KINDS)[number];

export const NEW_SLIDE_LABEL: Record<NewSlideKind, string> = {
  prose: "ტექსტი",
  bullets: "პუნქტები",
  "two-column": "ორი სვეტი",
  image: "სათაური + ფოტო",
  quote: "ციტატა",
  "key-figure": "მთავარი რიცხვი",
  section: "სექცია",
  thanks: "მადლობა",
};

export const LAYOUT_LABEL: Record<SlideLayout, string> = {
  prose: "ტექსტი",
  bullets: "პუნქტები",
  "two-column": "ორი სვეტი",
  quote: "ციტატა",
  "key-figure": "მთავარი რიცხვი",
  section: "სექცია",
};

/** Placeholder text the student overwrites. */
const PLACEHOLDER = {
  title: "სლაიდის სათაური",
  body: "აქ დაწერე ტექსტი: 2–4 წინადადება ამ სლაიდის მთავარ აზრზე.",
  point: "პუნქტი",
  column: (n: number) => ({ heading: `სვეტი ${n}`, text: "მოკლე ტექსტი ამ მხარეზე." }),
  quote: "ციტატის ან მთავარი თეზისის ტექსტი",
  figure: { value: "[მონაცემი მიუთითე]", caption: "ერთი წინადადება, რას ნიშნავს ეს რიცხვი." },
};

export function nextSlideId(slides: GeneratedSlide[]): number {
  return slides.reduce((max, slide) => Math.max(max, slide.id), 0) + 1;
}

/** A fresh slide of the chosen kind, with placeholder text. */
export function newSlide(kind: NewSlideKind, id: number, language: DeckLanguage = "ka"): GeneratedSlide {
  const base = { id, images: [] as GeneratedSlide["images"], title: PLACEHOLDER.title };
  switch (kind) {
    case "thanks": {
      const thanks = thanksSlide(language);
      return {
        ...base,
        type: "thanks",
        slideType: thanks.slideType,
        title: thanks.title,
        layout: "section",
        body: thanks.body ?? undefined,
        footnote: thanks.footnote,
      };
    }
    case "image":
      return { ...base, type: "image", slideType: "ფოტო", layout: "prose" };
    case "bullets":
      return { ...base, type: "content", slideType: "პუნქტები", layout: "bullets", points: [`${PLACEHOLDER.point} 1`, `${PLACEHOLDER.point} 2`, `${PLACEHOLDER.point} 3`] };
    case "two-column":
      return { ...base, type: "content", slideType: "შედარება", layout: "two-column", columns: [PLACEHOLDER.column(1), PLACEHOLDER.column(2)] };
    case "quote":
      return { ...base, type: "content", slideType: "ციტატა", layout: "quote", quote: { text: PLACEHOLDER.quote } };
    case "key-figure":
      return { ...base, type: "stats", slideType: "მონაცემი", layout: "key-figure", figure: { ...PLACEHOLDER.figure } };
    case "section":
      return { ...base, type: "content", slideType: "სექცია", layout: "section", title: "სექციის სათაური" };
    case "prose":
    default:
      return { ...base, type: "content", slideType: "ტექსტი", layout: "prose", body: PLACEHOLDER.body };
  }
}

/** Inserts after `afterIndex` (‑1 → at the start); returns the new slide's index. */
export function insertSlideAfter(
  slides: GeneratedSlide[],
  afterIndex: number,
  slide: GeneratedSlide,
): { slides: GeneratedSlide[]; index: number } {
  const index = Math.min(Math.max(afterIndex + 1, 0), slides.length);
  return { slides: [...slides.slice(0, index), slide, ...slides.slice(index)], index };
}

/** A copy right after the original, with its own id (photos stay on the original). */
export function duplicateSlide(slides: GeneratedSlide[], index: number): GeneratedSlide[] {
  const source = slides[index];
  if (!source) return slides;
  const copy: GeneratedSlide = structuredClone({ ...source, id: nextSlideId(slides), images: [] });
  return insertSlideAfter(slides, index, copy).slides;
}

export function deleteSlide(slides: GeneratedSlide[], index: number): GeneratedSlide[] {
  return slides.filter((_, i) => i !== index);
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(Math.min(Math.max(to, 0), next.length), 0, item);
  return next;
}

export function updateSlideAt(
  slides: GeneratedSlide[],
  index: number,
  update: (slide: GeneratedSlide) => GeneratedSlide,
): GeneratedSlide[] {
  return slides.map((slide, i) => (i === index ? update(slide) : slide));
}

const sentences = (text: string) =>
  text
    .split(/(?<=[.!?…])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

/** The slide's main text as one paragraph, whatever its layout. */
function mainText(slide: GeneratedSlide): string {
  const layout = effectiveLayout(slide);
  if (layout === "bullets" && slide.points?.length) return pointsToProse(slide.points);
  if (layout === "two-column" && slide.columns?.length) return slide.columns.map((c) => `${c.heading}. ${c.text}`).join(" ");
  if (layout === "quote" && slide.quote) return slide.quote.text;
  if (layout === "key-figure" && slide.figure) return slide.figure.caption;
  return slide.body ?? slide.points?.join(" ") ?? "";
}

/**
 * Switches a slide to another layout, filling the new layout's fields from
 * the text it already has. The old fields are kept, so switching back
 * brings them back unchanged.
 */
export function convertLayout(slide: GeneratedSlide, layout: SlideLayout): GeneratedSlide {
  const current = effectiveLayout(slide);
  if (current === layout) return slide;
  const text = mainText(slide);
  const next: GeneratedSlide = { ...slide, layout };
  switch (layout) {
    case "prose":
    case "section":
      if (!slide.body) next.body = text || (layout === "prose" ? PLACEHOLDER.body : undefined);
      break;
    case "bullets":
      if (!slide.points?.length) {
        const parts = sentences(text).slice(0, 4);
        next.points = parts.length > 0 ? parts : [`${PLACEHOLDER.point} 1`, `${PLACEHOLDER.point} 2`];
      }
      break;
    case "two-column":
      if (!slide.columns?.length) {
        const parts = slide.points?.length && current === "bullets" ? slide.points : sentences(text);
        const half = Math.ceil(parts.length / 2);
        next.columns = [
          { heading: PLACEHOLDER.column(1).heading, text: parts.slice(0, half).join(" ") || PLACEHOLDER.column(1).text },
          { heading: PLACEHOLDER.column(2).heading, text: parts.slice(half).join(" ") || PLACEHOLDER.column(2).text },
        ];
      }
      break;
    case "quote":
      if (!slide.quote) next.quote = { text: text || PLACEHOLDER.quote };
      break;
    case "key-figure":
      if (!slide.figure) next.figure = { value: PLACEHOLDER.figure.value, caption: text || PLACEHOLDER.figure.caption };
      break;
  }
  return next;
}

/** „სლაიდის ტექსტის კოპირება“: what's visible on the slide, as plain text. */
export function slidePlainText(slide: GeneratedSlide): string {
  const layout = effectiveLayout(slide);
  const lines: string[] = [slide.title];
  if (slide.type === "thanks" || slide.type === "cover" || layout === "section" || layout === "prose") {
    if (slide.body) lines.push(slide.body);
    else if (layout === "prose" && slide.points?.length) lines.push(slide.points.join(" "));
  } else if (layout === "bullets") {
    lines.push(...(slide.points ?? []).map((point) => `• ${point}`));
  } else if (layout === "two-column") {
    for (const column of (slide.columns ?? []).slice(0, 2)) lines.push(`${column.heading}\n${column.text}`);
  } else if (layout === "quote" && slide.quote) {
    lines.push(`„${slide.quote.text}“`);
    if (slide.quote.author) lines.push(`— ${slide.quote.author}`);
  } else if (layout === "key-figure" && slide.figure) {
    lines.push(slide.figure.value, slide.figure.caption);
  }
  if (slide.footnote) lines.push(slide.footnote);
  return lines.filter(Boolean).join("\n\n");
}

/** One editable piece of text on a slide. */
export type TextField =
  | { kind: "title" }
  | { kind: "body" }
  | { kind: "footnote" }
  | { kind: "point"; index: number }
  | { kind: "column-heading"; index: number }
  | { kind: "column-text"; index: number }
  | { kind: "quote" }
  | { kind: "quote-author" }
  | { kind: "figure-value" }
  | { kind: "figure-caption" };

export const fieldKey = (field: TextField) => ("index" in field ? `${field.kind}:${field.index}` : field.kind);
export const sameField = (a: TextField | null | undefined, b: TextField | null | undefined) =>
  Boolean(a && b && fieldKey(a) === fieldKey(b));

/** What the AI is told it is rewriting. */
export const FIELD_LABEL: Record<TextField["kind"], string> = {
  title: "სლაიდის სათაური",
  body: "აბზაცი",
  footnote: "მინაწერი",
  point: "პუნქტი",
  "column-heading": "სვეტის სათაური",
  "column-text": "სვეტის ტექსტი",
  quote: "ციტატა",
  "quote-author": "ავტორი",
  "figure-value": "რიცხვი",
  "figure-caption": "რიცხვის ახსნა",
};

export function getField(slide: GeneratedSlide, field: TextField): string {
  switch (field.kind) {
    case "title":
      return slide.title;
    case "body":
      return slide.body ?? "";
    case "footnote":
      return slide.footnote ?? "";
    case "point":
      return slide.points?.[field.index] ?? "";
    case "column-heading":
      return slide.columns?.[field.index]?.heading ?? "";
    case "column-text":
      return slide.columns?.[field.index]?.text ?? "";
    case "quote":
      return slide.quote?.text ?? "";
    case "quote-author":
      return slide.quote?.author ?? "";
    case "figure-value":
      return slide.figure?.value ?? "";
    case "figure-caption":
      return slide.figure?.caption ?? "";
  }
}

const replaceAt = <T>(items: T[] | undefined, index: number, update: (item: T) => T): T[] | undefined =>
  items?.map((item, i) => (i === index ? update(item) : item));

export function setField(slide: GeneratedSlide, field: TextField, value: string): GeneratedSlide {
  switch (field.kind) {
    case "title":
      return { ...slide, title: value };
    case "body":
      return { ...slide, body: value };
    case "footnote":
      return { ...slide, footnote: value };
    case "point":
      return { ...slide, points: replaceAt(slide.points, field.index, () => value) };
    case "column-heading":
      return { ...slide, columns: replaceAt(slide.columns, field.index, (column) => ({ ...column, heading: value })) };
    case "column-text":
      return { ...slide, columns: replaceAt(slide.columns, field.index, (column) => ({ ...column, text: value })) };
    case "quote":
      return { ...slide, quote: { ...slide.quote, text: value } };
    case "quote-author":
      return { ...slide, quote: { text: slide.quote?.text ?? "", author: value || undefined } };
    case "figure-value":
      return { ...slide, figure: { caption: slide.figure?.caption ?? "", value } };
    case "figure-caption":
      return { ...slide, figure: { value: slide.figure?.value ?? "", caption: value } };
  }
}

export function insertPoint(slide: GeneratedSlide, at: number, text = ""): GeneratedSlide {
  const points = [...(slide.points ?? [])];
  points.splice(Math.min(Math.max(at, 0), points.length), 0, text);
  return { ...slide, points };
}

export function removePoint(slide: GeneratedSlide, index: number): GeneratedSlide {
  return { ...slide, points: (slide.points ?? []).filter((_, i) => i !== index) };
}

/** Whether the field can be deleted from the slide (titles and figures can't). */
export function canDeleteField(field: TextField): boolean {
  return field.kind === "point" || field.kind === "body" || field.kind === "quote-author" || field.kind === "footnote";
}

/** Deletes a point, or empties an optional text. */
export function deleteField(slide: GeneratedSlide, field: TextField): GeneratedSlide {
  if (field.kind === "point") return removePoint(slide, field.index);
  if (field.kind === "body") return { ...slide, body: undefined };
  if (field.kind === "footnote") return { ...slide, footnote: undefined };
  if (field.kind === "quote-author" && slide.quote) return { ...slide, quote: { text: slide.quote.text } };
  return slide;
}
