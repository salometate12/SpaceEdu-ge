/**
 * The study-plan generator's surfaces, kept here so the form and the result
 * card match. Neutral on purpose: white (or the dark card) with a hairline
 * border — the page's one strong colour is the generate button.
 *
 * Local to this page. The shared `.dashboard-tool-card` (beige paper) is
 * still used elsewhere and is not touched.
 */
export const studyPlanCardClass =
  "rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[0_1px_2px_rgb(15_23_42/0.04)] dark:border-white/10 dark:shadow-none sm:p-6";

/** Inputs, textarea and date: white, hairline border, soft accent ring on focus. */
export const studyPlanFieldClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-[border-color,box-shadow] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-pink-500/15 dark:border-white/10 dark:bg-[var(--bg-secondary)] dark:[color-scheme:dark]";

export const studyPlanLabelClass = "text-sm font-medium text-[var(--text-primary)]";
