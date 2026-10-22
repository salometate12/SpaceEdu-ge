/** The study plan's light style (tokens in app/study-plan/study-plan-theme.css). */

export const SP_FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sp-accent)]/40";

export const SP_CARD = "rounded-[22px] border border-[var(--sp-card-border)] bg-[var(--sp-card)]";

export const SP_LABEL = "text-[13px] font-semibold text-[var(--sp-muted)]";

/** A form field; red when it has an error (`aria-invalid`). */
export const SP_FIELD = `h-11 w-full rounded-[14px] border border-[var(--sp-line)] bg-[var(--sp-card)] px-3.5 text-[16px] text-[var(--sp-strong)] outline-none transition-colors placeholder:text-[var(--sp-muted)] focus:border-[var(--sp-strong)] aria-[invalid=true]:border-rose-500 sm:text-[15px]`;

export const SP_PRIMARY = `inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--sp-accent)] px-6 text-[15px] font-bold text-white transition-[filter,opacity] hover:brightness-110 disabled:pointer-events-none disabled:opacity-45 ${SP_FOCUS}`;

export const SP_QUIET = `inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--sp-line)] bg-[var(--sp-card)] px-3.5 text-[13px] font-semibold text-[var(--sp-strong)] transition-colors hover:border-[var(--sp-muted)] ${SP_FOCUS}`;
