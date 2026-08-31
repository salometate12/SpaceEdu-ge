import type { ReactNode } from "react";
import { DashboardBannerStats, type DashboardWorkspace } from "./DashboardBannerStats";

interface DashboardGreetingBannerProps {
  workspace: DashboardWorkspace;
  badge?: ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardGreetingBanner({
  workspace,
  badge,
  title,
  subtitle,
}: DashboardGreetingBannerProps) {
  const vivid = workspace === "student";

  return (
    <section
      className={`dashboard-hero flex flex-col items-stretch justify-center gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 ${vivid ? "mobile-vivid-hero" : ""}`}
    >
      <div className="min-w-0 flex-1">
        {badge ? (
          <div className={`mb-2 ${vivid ? "mobile-vivid-hero-badge" : ""}`}>{badge}</div>
        ) : null}
        <h1
          className={`headline text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white ${vivid ? "mobile-vivid-hero-title" : ""}`}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className={`mt-1 text-sm text-slate-600 dark:text-zinc-400 ${vivid ? "max-[639px]:hidden" : ""}`}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className={vivid ? "max-[639px]:hidden" : ""}>
        <DashboardBannerStats workspace={workspace} />
      </div>
    </section>
  );
}
