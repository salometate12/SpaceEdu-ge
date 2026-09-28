import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * The colours a card may give its icon tile — and only its icon tile.
 * Titles, borders, chips, buttons and progress bars stay neutral / accent.
 * Light: a ~12% tint behind a full-strength icon (amber uses 700, since
 * 600 on its own tint is under 3:1). Dark: a 15% wash behind a light icon.
 */
export const DASHBOARD_CARD_TONES = {
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
  pink: "bg-pink-100 text-pink-600 dark:bg-pink-400/15 dark:text-pink-300",
} as const;

export type DashboardCardTone = keyof typeof DASHBOARD_CARD_TONES;

const NEUTRAL_ICON = "bg-[var(--bg-secondary)] text-[var(--text-secondary)]";

const SURFACE =
  "border-[var(--dashboard-card-border,var(--border))] bg-[var(--bg-card)] hover:border-[var(--border-hover)]";

/** A soft pink wash from the top-left corner into the plain card. */
const HIGHLIGHT_SURFACE =
  "border-pink-200 bg-[linear-gradient(135deg,#fdf2f8_0%,var(--bg-card)_70%)] hover:border-pink-300 dark:border-pink-400/20 dark:bg-[linear-gradient(135deg,rgb(236_72_153/0.08)_0%,var(--bg-card)_70%)] dark:hover:border-pink-400/30";

interface DashboardCardProps {
  icon: LucideIcon;
  title: string;
  /** One short line under the title. */
  subtitle?: ReactNode;
  /** A small neutral counter chip on the right, e.g. "0/3". */
  meta?: ReactNode;
  /** A control on the right, next to (or instead of) the meta chip. */
  action?: ReactNode;
  /** Colours the icon tile only. Without it the icon stays neutral. */
  tone?: DashboardCardTone;
  /**
   * Marks the one card a page leads with. At most ONE card per page may
   * set this — two highlighted cards cancel each other out.
   */
  highlight?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * The plain card the student dashboard's content sections share: a white
 * (or dark) surface, one hairline border, and an icon tile. Colour is kept
 * to the icon tile (`tone`) and, on one card per page, a faint wash
 * (`highlight`) — the accent is saved for what a student acts on.
 */
export function DashboardCard({
  icon: Icon,
  title,
  subtitle,
  meta,
  action,
  tone,
  highlight = false,
  children,
  className = "",
}: DashboardCardProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={`relative rounded-2xl border p-5 shadow-[0_1px_2px_rgb(28_25_23/0.04)] transition-[border-color,box-shadow] duration-200 hover:shadow-[0_2px_12px_rgb(15_23_42/0.05)] dark:shadow-none dark:hover:shadow-none sm:p-6 ${
        highlight ? HIGHLIGHT_SURFACE : SURFACE
      } ${className}`}
    >
      {/* On a phone the action drops under the subtitle rather than
          squeezing the title into a narrow column; from `sm` it sits top
          right. The meta chip is short and always stays by the title. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-y-0.5">
        <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              tone ? DASHBOARD_CARD_TONES[tone] : NEUTRAL_ICON
            }`}
            aria-hidden
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <h2
            id={titleId}
            className="headline min-w-0 flex-1 text-base font-semibold leading-snug text-[var(--text-primary)]"
          >
            {title}
          </h2>
          {meta !== undefined && (
            <span className="shrink-0 rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-medium tabular-nums text-[var(--text-secondary)]">
              {meta}
            </span>
          )}
        </div>
        {action && <div className="order-2 flex shrink-0 items-center sm:order-1">{action}</div>}
        {subtitle && (
          <div className="order-1 basis-full text-sm leading-normal text-[var(--text-secondary)] sm:order-2 sm:pl-12">
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

/** The small outline button a card puts in its `action` slot. */
export const dashboardCardActionClass =
  "inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--accent-primary)]/40 px-3 text-xs font-semibold text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50";
