// Shared (server + client) presentational pieces — no "use client" so server
// pages can use them. The one interactive piece, Toggle, lives in its own
// client file and is re-exported here. Colours come from profile-shell.css
// (`--ps-*`), loaded by ProfileShell.
import type { ReactNode } from "react";

export { Toggle } from "./Toggle";

export type PsButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/** A pill button's classes (profile-shell.css), for <button>, <Link> and <a>. */
export function psButton(
  variant: PsButtonVariant = "secondary",
  { size = "md", className = "" }: { size?: "md" | "sm"; className?: string } = {},
): string {
  return ["ps-btn", `ps-btn--${variant}`, size === "sm" ? "ps-btn--sm" : "", className].filter(Boolean).join(" ");
}

/** Horizontal padding every card part and row shares, so edges line up. */
export const CARD_X = "px-5 sm:px-6";

/**
 * One row in a card's list: text on the left, a control on the right. On a
 * phone the control drops under the text instead of squeezing it.
 */
export const SETTINGS_ROW = `flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-[var(--ps-divider)] py-4 first:border-t-0 ${CARD_X}`;
/** The text column of a row: takes the room, wraps (never cut) when narrow. */
export const SETTINGS_ROW_TEXT = "min-w-[11rem] flex-1";
/** A row's title and its line under it. */
export const ROW_TITLE = "text-[15px] font-medium text-[var(--ps-title)]";
export const ROW_SUB = "mt-0.5 text-[13.5px] leading-snug text-[var(--ps-muted)]";

/** The page's own title, above its cards (desktop; phones show it in the back bar). */
export function SettingsPageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="hidden text-[28px] font-bold leading-tight tracking-tight text-[var(--ps-title)] md:block">
      {children}
    </h1>
  );
}

/**
 * A settings section: a white card with a title and a line under it.
 * `flush` drops the body padding for cards whose body is a list of
 * full-width rows (wrap those in <SettingsRows>).
 */
export function SettingsCard({
  id,
  title,
  subtitle,
  action,
  children,
  bodyClassName = "",
  danger = false,
  flush = false,
}: {
  /** An anchor, for the sections that old URLs redirect to. */
  id?: string;
  title?: string;
  subtitle?: string;
  /** Something on the title's right, e.g. a small link. */
  action?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  danger?: boolean;
  flush?: boolean;
}) {
  return (
    <section
      id={id}
      className={`ps-card overflow-hidden ${danger ? "!border-[var(--ps-danger-border)]" : ""}`}
    >
      {title && (
        <div className={`flex items-start justify-between gap-3 ${CARD_X} pt-[22px]`}>
          <div className="min-w-0">
            <h2 className={`text-[17px] font-bold ${danger ? "text-[var(--ps-danger)]" : "text-[var(--ps-title)]"}`}>
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-[13.5px] leading-snug text-[var(--ps-muted)]">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={flush ? "pb-1 pt-2" : bodyClassName || `${CARD_X} pb-6 ${title ? "pt-5" : "pt-6"}`}>
        {children}
      </div>
    </section>
  );
}

/** The full-width list inside a flush card. */
export function SettingsRows({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

/** The small grey „მალე“ (coming soon) pill. */
export function SoonBadge() {
  return (
    <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-[var(--ps-soft)] px-2.5 text-[12px] font-semibold text-[var(--ps-muted)]">
      მალე
    </span>
  );
}

/** A small green pill: „აქტიური“, „მიმდინარე“. */
export function ActiveBadge({ children = "აქტიური" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-[var(--ps-ok-bg)] px-2.5 text-[12px] font-semibold text-[var(--ps-ok)]">
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

/** One row in a toggle list: title and sub on the left, the control on the right. */
export function ToggleRow({
  title,
  subtitle,
  control,
  muted = false,
}: {
  title: string;
  subtitle?: string;
  control: ReactNode;
  /** Greyed out: a feature that isn't there yet. */
  muted?: boolean;
}) {
  return (
    <div className={SETTINGS_ROW}>
      <div className={`${SETTINGS_ROW_TEXT} ${muted ? "opacity-60" : ""}`}>
        <div className={ROW_TITLE}>{title}</div>
        {subtitle && <div className={ROW_SUB}>{subtitle}</div>}
      </div>
      {control}
    </div>
  );
}
