"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
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
  // Both workspaces get the polished full-bleed banner on mobile; the
  // abiturient space just swaps the palette (emerald instead of cream).
  const abit = workspace === "abiturient";

  return (
    <motion.section
      initial={false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`dashboard-hero mobile-vivid-hero ${
        abit ? "mobile-vivid-hero--abit" : ""
      } flex flex-col items-stretch justify-center gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 max-[639px]:left-0 max-[639px]:right-0 max-[639px]:top-0 max-[639px]:z-20 max-[639px]:mt-0 max-[639px]:w-full max-[639px]:rounded-t-none max-[639px]:rounded-b-[36px]`}
    >
      <div className="min-w-0 flex-1">
        {badge ? <div className="mobile-vivid-hero-badge mb-2">{badge}</div> : null}
        <h1 className="headline mobile-vivid-hero-title text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-600 max-[639px]:hidden dark:text-zinc-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="max-[639px]:hidden">
        <DashboardBannerStats workspace={workspace} />
      </div>
    </motion.section>
  );
}
