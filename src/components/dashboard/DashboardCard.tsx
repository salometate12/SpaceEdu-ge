import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  icon: LucideIcon;
  title: string;
  /** One short line under the title. */
  subtitle?: ReactNode;
  /** A small neutral counter chip on the right, e.g. "0/3". */
  meta?: ReactNode;
  /** A control on the right, next to (or instead of) the meta chip. */
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * The plain card the student dashboard's content sections share: a white
 * (or dark) surface, one hairline border, and a neutral icon. The cards are
 * told apart by their icon and title, not by colour — the accent is saved
 * for the one thing on each card a student acts on.
 */
export function DashboardCard({
  icon: Icon,
  title,
  subtitle,
  meta,
  action,
  children,
  className = "",
}: DashboardCardProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={`relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-[border-color,box-shadow] duration-200 hover:border-[var(--border-hover)] hover:shadow-[0_2px_12px_rgb(15_23_42/0.05)] sm:p-6 ${className}`}
    >
      {/* On a phone the action drops under the subtitle rather than
          squeezing the title into a narrow column; from `sm` it sits top
          right. The meta chip is short and always stays by the title. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-y-0.5">
        <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
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
