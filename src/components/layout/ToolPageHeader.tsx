import Link from "next/link";
import type { ReactNode } from "react";

interface ToolPageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: ReactNode;
}

export function ToolPageHeader({
  title,
  subtitle,
  backHref = "/dashboard-student",
  actions,
}: ToolPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <Link
          href={backHref}
          className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-purple-400/30 dark:hover:bg-purple-500/10 dark:hover:text-white"
          aria-label="Dashboard"
        >
          ←
        </Link>
        <div>
          <h1 className="headline text-2xl font-bold text-slate-900 sm:text-3xl dark:text-zinc-100">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 max-w-4xl text-sm text-slate-600 dark:text-zinc-400">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
