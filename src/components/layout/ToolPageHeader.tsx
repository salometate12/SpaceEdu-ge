import Link from "next/link";
import type { ReactNode } from "react";

interface ToolPageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: ReactNode;
  /** "neutral" keeps the back button grey on hover, for pages that save
   * the accent for their own main action. Defaults to the pink hover. */
  tone?: "default" | "neutral";
}

const BACK_TONE = {
  default:
    "border-slate-200 bg-white text-slate-600 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-pink-400/30 dark:hover:bg-pink-500/10 dark:hover:text-white",
  neutral:
    "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:bg-stone-50 hover:text-[var(--text-primary)] dark:border-white/10 dark:hover:bg-white/[0.05]",
} as const;

export function ToolPageHeader({
  title,
  subtitle,
  backHref = "/dashboard-student",
  actions,
  tone = "default",
}: ToolPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <Link
          href={backHref}
          className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/25 ${BACK_TONE[tone]}`}
          aria-label="Dashboard"
        >
          ←
        </Link>
        <div>
          <h1 className="headline text-2xl font-bold text-slate-900 sm:text-3xl dark:text-zinc-100">
            {title}
          </h1>
          {subtitle && (
            <p
              className={`mt-1 max-w-4xl text-sm ${
                tone === "neutral" ? "text-[var(--text-secondary)]" : "text-slate-600 dark:text-zinc-400"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
