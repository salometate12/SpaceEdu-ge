/**
 * The notebook pages' pen colours.
 *
 * Shared by /about and the landing page so the two read as the same hand.
 * Every entry carries a night-mode pair — these surfaces are theme-aware,
 * unlike the landing's older neon sections.
 */

export type NotebookAccent = "blue" | "green" | "pink" | "amber" | "violet";

/** Ink colour for a highlighted word or a card's label. */
export const ACCENT_TEXT: Record<NotebookAccent, string> = {
  blue: "text-sky-600 dark:text-sky-300",
  green: "text-emerald-600 dark:text-emerald-300",
  pink: "text-pink-600 dark:text-pink-300",
  amber: "text-amber-600 dark:text-amber-300",
  violet: "text-violet-600 dark:text-violet-300",
};

/** Underline drawn beneath a highlighted phrase in body copy. */
export const ACCENT_UNDERLINE: Record<NotebookAccent, string> = {
  blue: "decoration-sky-400/50 dark:decoration-sky-400/40",
  green: "decoration-emerald-400/50 dark:decoration-emerald-400/40",
  pink: "decoration-pink-400/50 dark:decoration-pink-400/40",
  amber: "decoration-amber-400/60 dark:decoration-amber-400/40",
  violet: "decoration-violet-400/50 dark:decoration-violet-400/40",
};

/** Border and fill for a card stuck onto the page. */
export const ACCENT_CARD: Record<NotebookAccent, string> = {
  blue: "border-sky-300/70 bg-sky-100/50 dark:border-sky-400/25 dark:bg-sky-400/[0.07]",
  green:
    "border-emerald-300/70 bg-emerald-100/50 dark:border-emerald-400/25 dark:bg-emerald-400/[0.07]",
  pink: "border-pink-300/70 bg-pink-100/50 dark:border-pink-400/25 dark:bg-pink-400/[0.07]",
  amber: "border-amber-300/70 bg-amber-100/50 dark:border-amber-400/25 dark:bg-amber-400/[0.07]",
  violet:
    "border-violet-300/70 bg-violet-100/50 dark:border-violet-400/25 dark:bg-violet-400/[0.07]",
};

/** Same as `ACCENT_CARD`, but reading as a small pill rather than a card. */
export const ACCENT_PILL: Record<NotebookAccent, string> = {
  blue: "border-sky-400/70 bg-sky-100/70 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-200",
  green:
    "border-emerald-400/70 bg-emerald-100/70 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200",
  pink: "border-pink-400/70 bg-pink-100/70 text-pink-700 dark:border-pink-400/30 dark:bg-pink-400/10 dark:text-pink-200",
  amber:
    "border-amber-400/70 bg-amber-100/70 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
  violet:
    "border-violet-400/70 bg-violet-100/70 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-200",
};

/**
 * A filled sticker: the page's few loud elements — primary buttons and
 * badges. Pair it with `.paper-sticker`, which supplies the hard offset
 * shadow that makes them read as stuck onto the paper rather than lit
 * from behind.
 */
export const ACCENT_SOLID: Record<NotebookAccent, string> = {
  blue: "border-sky-700 bg-sky-600 text-white dark:border-sky-300/40",
  green: "border-emerald-700 bg-emerald-600 text-white dark:border-emerald-300/40",
  pink: "border-pink-700 bg-pink-600 text-white dark:border-pink-300/40",
  amber: "border-amber-600 bg-amber-500 text-white dark:border-amber-300/40",
  violet: "border-violet-700 bg-violet-600 text-white dark:border-violet-300/40",
};

/** Neutral card: the same paper edge, without picking up a pen colour. */
export const PLAIN_CARD =
  "border-slate-300/80 bg-white/55 dark:border-white/[0.12] dark:bg-white/[0.04]";
