// Shared (server + client) presentational pieces — no "use client" so server
// pages can pass an `icon` component into SettingsCard. The one interactive
// piece, Toggle, lives in its own client file and is re-exported here.
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export { Toggle } from "./Toggle";

/**
 * Settings colours, in one place. One accent only, the brand pink, and only on
 * small markers (icon circle, toggle, focus); cards, chips and text are neutral.
 */
export const SETTINGS_TONE = {
  /** Icon next to a card title. */
  headingIcon: "text-[var(--text-secondary)]",
  /** The 40px circle holding the icon of an "active" card. */
  iconWrap:
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-50 text-[var(--accent-primary)] dark:bg-pink-500/10 dark:text-pink-300",
  /** The current plan / space card. */
  activeCard: "flex items-center gap-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4",
  /** A subject (or similar) chip. */
  chip: "rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-xs text-[var(--text-primary)]",
  /** The icon square of a toggle row. */
  rowIcon: "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
  /** Focus on a text field: pink border, soft ring. */
  fieldFocus: "focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/15",
} as const;

/** Horizontal padding every card part and row shares, so edges line up. */
export const CARD_X = "px-4 sm:px-5";

/**
 * One row in a card's list: icon, text and a control on one line, the same
 * padding as the card. On a phone the control drops under the text instead
 * of squeezing it.
 */
export const SETTINGS_ROW = `flex flex-wrap items-center gap-3 border-b border-[var(--border)] py-4 last:border-b-0 ${CARD_X}`;
/** The text column of a row: takes the room, wraps (never cut) when narrow. */
export const SETTINGS_ROW_TEXT = "min-w-[10rem] flex-1";

/**
 * A settings card: thin border, rounded, optional icon title + subtitle.
 * The card is as tall as its content — `overflow-hidden` only rounds the
 * corners. `flush` drops the body padding for cards whose body is a list of
 * full-width rows (wrap those in <SettingsRows>); anything else inside a
 * flush card brings its own padding (CARD_X).
 */
export function SettingsCard({
  icon: Icon,
  title,
  subtitle,
  children,
  bodyClassName = "",
  danger = false,
  flush = false,
}: {
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  bodyClassName?: string;
  danger?: boolean;
  flush?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
      {title && (
        <div className={`${CARD_X} pt-5`}>
          <h2
            className={`flex items-center gap-2 text-[15px] font-medium ${
              danger ? "text-rose-600 dark:text-rose-400" : "text-[var(--text-primary)]"
            }`}
          >
            {Icon && (
              <Icon
                className={`h-4 w-4 stroke-[1.75] ${danger ? "text-rose-600 dark:text-rose-400" : SETTINGS_TONE.headingIcon}`}
                aria-hidden
              />
            )}
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{subtitle}</p>
          )}
        </div>
      )}
      <div className={flush ? "pt-4" : bodyClassName || `${CARD_X} py-5`}>{children}</div>
    </section>
  );
}

/** The full-width list inside a flush card, under a divider. */
export function SettingsRows({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`border-t border-[var(--border)] ${className}`}>{children}</div>;
}

/** The small grey "მალე" (coming soon) badge. */
export function SoonBadge() {
  return (
    <span className="nb-soon ml-auto shrink-0 text-[var(--text-secondary)]">
      მალე
    </span>
  );
}

/** The "აქტიური" pill: neutral, with a small green "on" dot. */
export function ActiveBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" aria-hidden />
      აქტიური
    </span>
  );
}

/** The current plan / space: neutral card, pink icon circle, "აქტიური" pill. */
export function ActiveCard({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle?: string }) {
  return (
    <div className={SETTINGS_TONE.activeCard}>
      <span className={SETTINGS_TONE.iconWrap}>
        <Icon className="h-[18px] w-[18px] stroke-[1.75]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-[var(--text-primary)]">{title}</div>
        {subtitle && <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{subtitle}</div>}
      </div>
      <ActiveBadge />
    </div>
  );
}

/** One row in a toggle list: neutral icon square, title/sub, and a control. */
export function ToggleRow({
  icon: Icon,
  title,
  subtitle,
  control,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  control: ReactNode;
}) {
  return (
    <div className={SETTINGS_ROW}>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${SETTINGS_TONE.rowIcon}`}
      >
        <Icon className="h-4 w-4 stroke-[1.75]" aria-hidden />
      </span>
      <div className={SETTINGS_ROW_TEXT}>
        <div className="text-[13px] text-[var(--text-primary)]">{title}</div>
        {subtitle && <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{subtitle}</div>}
      </div>
      {control}
    </div>
  );
}
