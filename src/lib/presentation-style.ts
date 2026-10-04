/**
 * Keeps generated decks reading like a person wrote them: few bullet
 * slides, none of the stock "AI" phrases, and always a thank-you slide at
 * the end. Pure, so the API route and the tests share it.
 */

import type { SlideLayout } from "@/lib/presentation-constants";

/** Stock phrases that make a text read as machine-written. */
export const AI_TELL_PHRASES = [
  "მნიშვნელოვანია აღინიშნოს",
  "უნდა აღინიშნოს",
  "აღსანიშნავია, რომ",
  "დღევანდელ სწრაფად ცვალებად სამყაროში",
  "სწრაფად ცვალებად სამყაროში",
  "გადამწყვეტ როლს ასრულებს",
  "გადამწყვეტ როლს თამაშობს",
  "თამაშის წესების შემცვლელი",
  "მრავალმხრივი",
  "ყოვლისმომცველი",
  "ღრმად ჩავუღრმავდეთ",
  "ჩავუღრმავდეთ",
  "დასკვნის სახით შეიძლება ითქვას",
  "შეჯამების სახით",
  "ინოვაციური",
  "უნიკალური",
  "საინტერესო",
  "უდავოდ",
] as const;

const EMOJI = /\p{Extended_Pictographic}/u;
const BOLD_LABEL = /^\s*\*\*[^*]{1,40}:\*\*/;

/** Every stock phrase or pattern found in the text (phrases once each). */
export function findAiTells(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = AI_TELL_PHRASES.filter((phrase) => lower.includes(phrase.toLowerCase()));
  if (EMOJI.test(text)) found.push("emoji");
  if (text.split("\n").some((line) => BOLD_LABEL.test(line))) found.push("**ტერმინი:** პუნქტი");
  const dashes = (text.match(/\s—\s/g) ?? []).length;
  if (dashes >= 3) found.push(`ტირეები (${dashes})`);
  return found;
}

const PLACEHOLDER = /\[\s*(წყარო|მონაცემი)\s+მიუ[^\]]*\]/g;

/** The model sometimes misspells the placeholders („[მონაცემი მიუთიტე]“);
 * students search for the exact form, so normalise it. */
export function normalizePlaceholders(text: string): string {
  return text.replace(PLACEHOLDER, (_, kind: string) => `[${kind} მიუთითე]`);
}

/** Applies normalizePlaceholders to every text field of a slide. */
export function normalizeSlidePlaceholders<T extends StyleSlide>(slide: T): T {
  const fix = (value: string | null | undefined) => (typeof value === "string" ? normalizePlaceholders(value) : value);
  return {
    ...slide,
    title: normalizePlaceholders(slide.title),
    body: fix(slide.body),
    points: slide.points?.map(normalizePlaceholders) ?? slide.points,
    columns: slide.columns?.map((c) => ({ heading: normalizePlaceholders(c.heading), text: normalizePlaceholders(c.text) })) ?? slide.columns,
    quote: slide.quote ? { ...slide.quote, text: normalizePlaceholders(slide.quote.text), author: fix(slide.quote.author) } : slide.quote,
    figure: slide.figure ? { value: normalizePlaceholders(slide.figure.value), caption: normalizePlaceholders(slide.figure.caption) } : slide.figure,
  };
}

/** The slide fields this module reads. */
export interface StyleSlide {
  type: string;
  title: string;
  layout?: SlideLayout | null;
  body?: string | null;
  points?: string[] | null;
  columns?: { heading: string; text: string }[] | null;
  quote?: { text: string; author?: string | null } | null;
  figure?: { value: string; caption: string } | null;
  footnote?: string;
}

/** All of a slide's visible text, for the phrase check. */
export function slideText(slide: StyleSlide): string {
  return [
    slide.title,
    slide.body,
    ...(slide.points ?? []),
    ...(slide.columns ?? []).flatMap((column) => [column.heading, column.text]),
    slide.quote?.text,
    slide.quote?.author,
    slide.figure?.value,
    slide.figure?.caption,
  ]
    .filter(Boolean)
    .join("\n");
}

/** The layout a slide effectively has (older slides carry none). */
export function effectiveLayout(slide: StyleSlide): SlideLayout {
  if (slide.layout) return slide.layout;
  return slide.points && slide.points.length > 0 ? "bullets" : "prose";
}

const isFrame = (slide: StyleSlide) => slide.type === "cover" || slide.type === "thanks";

/** Bullets may cover at most ~30% of the content slides. */
export const MAX_BULLET_SHARE = 0.3;

export interface BulletCheck {
  bulletSlides: number;
  contentSlides: number;
  allowed: number;
  consecutive: boolean;
  ok: boolean;
}

/** Whether bullets stay under ~30% of the slides and never run twice in a row. */
export function checkBullets(slides: StyleSlide[]): BulletCheck {
  const content = slides.filter((slide) => !isFrame(slide));
  const flags = content.map((slide) => effectiveLayout(slide) === "bullets");
  const bulletSlides = flags.filter(Boolean).length;
  const allowed = Math.max(1, Math.floor(content.length * MAX_BULLET_SHARE));
  const consecutive = flags.some((flag, index) => flag && flags[index - 1]);
  return {
    bulletSlides,
    contentSlides: content.length,
    allowed,
    consecutive,
    ok: bulletSlides <= allowed && !consecutive,
  };
}

/** Turns a list of points into one paragraph of sentences. */
export function pointsToProse(points: string[]): string {
  return points
    .map((point) => point.replace(BOLD_LABEL, "").replace(/\*\*/g, "").trim())
    .filter(Boolean)
    // No capitalising: toUpperCase() turns Georgian Mkhedruli into Mtavruli.
    .map((point) => (/[.!?…]$/.test(point) ? point : `${point}.`))
    .join(" ");
}

/**
 * Last resort after a retry: bullet slides that break the rule (a second
 * one in a row, or over the share) become prose. A re-generation reads far
 * better, so the route only calls this when the retry didn't help.
 */
export function convertExcessBullets<T extends StyleSlide>(slides: T[]): T[] {
  const { allowed } = checkBullets(slides);
  let kept = 0;
  let previousWasBullets = false;
  return slides.map((slide) => {
    if (isFrame(slide)) {
      previousWasBullets = false;
      return slide;
    }
    const bullets = effectiveLayout(slide) === "bullets";
    if (!bullets) {
      previousWasBullets = false;
      return slide;
    }
    if (kept < allowed && !previousWasBullets) {
      kept += 1;
      previousWasBullets = true;
      return { ...slide, layout: "bullets" as const };
    }
    previousWasBullets = false;
    const prose = [slide.body, pointsToProse(slide.points ?? [])].filter(Boolean).join(" ");
    return { ...slide, layout: "prose" as const, body: prose, points: null };
  });
}

export type DeckLanguage = "ka" | "en" | "both";

/** The wizard's language choice → which thank-you text to use. */
export function deckLanguage(raw: unknown): DeckLanguage {
  const value = String(raw ?? "");
  if (value.includes("+")) return "both";
  if (/ინგლის|english/i.test(value)) return "en";
  return "ka";
}

export const THANKS_TEXT = {
  ka: { title: "მადლობა ყურადღებისთვის!", questions: "კითხვები?" },
  en: { title: "Thank you for your attention!", questions: "Questions?" },
} as const;

const THANKS_PATTERN = /მადლობა|გმადლობ|thank\s*you|thanks/i;

/** A thank-you slide — what the code appends to every deck. */
export function thanksSlide(language: DeckLanguage): StyleSlide & { type: "thanks"; slideType: string } {
  const main = language === "en" ? THANKS_TEXT.en : THANKS_TEXT.ka;
  return {
    type: "thanks",
    slideType: language === "en" ? "Thank you" : "მადლობა",
    title: main.title,
    layout: "section",
    body: language === "both" ? THANKS_TEXT.en.title : null,
    points: null,
    columns: null,
    quote: null,
    figure: null,
    footnote: language === "both" ? `${THANKS_TEXT.ka.questions} · ${THANKS_TEXT.en.questions}` : main.questions,
  };
}

const looksLikeThanks = (slide: StyleSlide) => slide.type === "thanks" || THANKS_PATTERN.test(slide.title);

/**
 * Ends the deck with exactly one thank-you slide in the deck's language:
 * any the model wrote at the end is replaced, so it never doubles.
 */
export function ensureThanksSlide<T extends StyleSlide>(slides: T[], language: DeckLanguage): (T | ReturnType<typeof thanksSlide>)[] {
  const trimmed = [...slides];
  while (trimmed.length > 0 && looksLikeThanks(trimmed[trimmed.length - 1])) trimmed.pop();
  return [...trimmed, thanksSlide(language)];
}
