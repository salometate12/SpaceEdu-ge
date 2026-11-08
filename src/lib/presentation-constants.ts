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

/** The wizard's slide counts (Step1Info). */
export const PRESENTATION_SLIDE_COUNTS = [5, 8, 10, 12, 15] as const;

/** „ენა“: the value sent to the AI and the chip's label. */
export const PRESENTATION_LANGUAGES = [
  { value: "ქართული", label: "ქართული" },
  { value: "ინგლისური", label: "English" },
  { value: "ქართული + ინგლისური", label: "ორივე" },
] as const;
export const DEFAULT_PRESENTATION_LANGUAGE = "ქართული";

/** „დეტალები“: the answers each question offers. */
export const PRESENTATION_QA_OPTIONS = {
  goal: ["ცნების განმარტება", "არგუმენტის დამტკიცება", "ისტორიის მიმოხილვა", "კვლევის წარდგენა"],
  // Students present to their groupmates, not classmates.
  audience: ["ჯგუფელები", "პროფესორი", "კომისია", "შერეული"],
  tone: ["აკადემიური", "მეგობრული", "ფორმალური", "კრეატიული"],
} as const;

/** How a slide's text is laid out — mixed so a deck isn't all bullets. */
export const SLIDE_LAYOUTS = ["prose", "bullets", "two-column", "quote", "key-figure", "section"] as const;
export type SlideLayout = (typeof SLIDE_LAYOUTS)[number];

export const SLIDE_TYPES = ["cover", "content", "image", "stats", "conclusion", "thanks"] as const;

/** „AI-ით გადაწერა“ options in the editor. */
export const PRESENTATION_REWRITE_MODES = ["shorter", "academic", "simpler", "prose"] as const;
export type PresentationRewriteMode = (typeof PRESENTATION_REWRITE_MODES)[number];
