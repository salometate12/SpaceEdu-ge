/**
 * The notebook pages' pen colours.
 *
 * Shared by /about and the notebook sections of the landing page so the two
 * read as the same hand. Every entry carries a night-mode pair — these
 * surfaces are theme-aware, unlike the landing's older neon sections.
 */

export type NotebookAccent = "blue" | "green" | "pink" | "amber";

/** Ink colour for a highlighted word or a card's label. */
export const ACCENT_TEXT: Record<NotebookAccent, string> = {
  blue: "text-sky-600 dark:text-sky-300",
  green: "text-emerald-600 dark:text-emerald-300",
  pink: "text-pink-600 dark:text-pink-300",
  amber: "text-amber-600 dark:text-amber-300",
};

/** Underline drawn beneath a highlighted phrase in body copy. */
export const ACCENT_UNDERLINE: Record<NotebookAccent, string> = {
  blue: "decoration-sky-400/50 dark:decoration-sky-400/40",
  green: "decoration-emerald-400/50 dark:decoration-emerald-400/40",
  pink: "decoration-pink-400/50 dark:decoration-pink-400/40",
  amber: "decoration-amber-400/60 dark:decoration-amber-400/40",
};

/** Border and fill for a card stuck onto the page. */
export const ACCENT_CARD: Record<NotebookAccent, string> = {
  blue: "border-sky-300/70 bg-sky-100/50 dark:border-sky-400/25 dark:bg-sky-400/[0.07]",
  green:
    "border-emerald-300/70 bg-emerald-100/50 dark:border-emerald-400/25 dark:bg-emerald-400/[0.07]",
  pink: "border-pink-300/70 bg-pink-100/50 dark:border-pink-400/25 dark:bg-pink-400/[0.07]",
  amber: "border-amber-300/70 bg-amber-100/50 dark:border-amber-400/25 dark:bg-amber-400/[0.07]",
};

/** Same as `ACCENT_CARD`, but reading as a small pill rather than a card. */
export const ACCENT_PILL: Record<NotebookAccent, string> = {
  blue: "border-sky-400/70 bg-sky-100/70 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-200",
  green:
    "border-emerald-400/70 bg-emerald-100/70 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200",
  pink: "border-pink-400/70 bg-pink-100/70 text-pink-700 dark:border-pink-400/30 dark:bg-pink-400/10 dark:text-pink-200",
  amber:
    "border-amber-400/70 bg-amber-100/70 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
};
