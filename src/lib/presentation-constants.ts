/**
 * Presentation constants shared by the wizard (client) and the API (no zod
 * here, so importing them doesn't pull the schema library into the page).
 */

/** The academic levels the tool offers (it's a student tool). */
export const PRESENTATION_LEVELS = ["ბაკალავრიატი", "მაგისტრატურა", "დოქტორანტურა"] as const;
export type PresentationLevel = (typeof PRESENTATION_LEVELS)[number];
export const DEFAULT_PRESENTATION_LEVEL: PresentationLevel = "ბაკალავრიატი";

/** Old values („უნივერსიტეტი“, „სკოლა“, „ეროვნულები“) and anything unknown
 * become the bachelor level. */
export function normalizePresentationLevel(raw: unknown): PresentationLevel {
  return (PRESENTATION_LEVELS as readonly string[]).includes(String(raw))
    ? (raw as PresentationLevel)
    : DEFAULT_PRESENTATION_LEVEL;
}

/** How a slide's text is laid out — mixed so a deck isn't all bullets. */
export const SLIDE_LAYOUTS = ["prose", "bullets", "two-column", "quote", "key-figure", "section"] as const;
export type SlideLayout = (typeof SLIDE_LAYOUTS)[number];

export const SLIDE_TYPES = ["cover", "content", "image", "stats", "conclusion", "thanks"] as const;
