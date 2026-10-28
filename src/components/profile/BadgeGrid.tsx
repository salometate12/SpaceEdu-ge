"use client";

import { Lock } from "lucide-react";
import type { Badge } from "@/lib/badges";
import type { StatsSpace } from "@/lib/activity-log";
import { useBadges } from "./useBadges";

interface BadgeGridProps {
  space: StatsSpace;
}

/** Each earned badge's circle, in the site's light palette. */
const EARNED_TONE: Record<Badge["color"], string> = {
  purple: "bg-[#fce7f3] text-[#be185d] dark:bg-[rgba(236,72,153,0.16)] dark:text-[#f9a8d4]",
  cyan: "bg-[#e0f2fe] text-[#0369a1] dark:bg-[rgba(56,189,248,0.14)] dark:text-[#7dd3fc]",
  green: "bg-[#dcfce7] text-[#15803d] dark:bg-[rgba(74,222,128,0.14)] dark:text-[#86efac]",
  amber: "bg-[#fef9c3] text-[#a16207] dark:bg-[rgba(250,204,21,0.14)] dark:text-[#fde68a]",
  gray: "bg-[var(--ps-soft)] text-[var(--ps-muted)]",
};

/** Eight badges in one row (4 × 2 on a phone): earned ones in colour, locked ones dashed with what they need. */
export function BadgeGrid({ space }: BadgeGridProps) {
  const badges = useBadges(space) ?? [];
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;

  return (
    <section aria-label="ბეჯები" className="ps-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold text-[var(--ps-title)]">ბეჯები</h2>
        <span className="text-[13.5px] text-[var(--ps-muted)]">{badges.length ? `${unlockedCount} / ${badges.length}` : ""}</span>
      </div>
      <ul className="mt-5 grid min-h-[96px] grid-cols-4 gap-x-2 gap-y-5 lg:grid-cols-8">
        {badges.map((badge) => (
          <li
            key={badge.id}
            className={`flex flex-col items-center text-center ${badge.unlocked ? "" : "opacity-55"}`}
            title={badge.unlocked ? badge.name : badge.requirement}
          >
            {badge.unlocked ? (
              <span className={`flex h-12 w-12 items-center justify-center rounded-full ${EARNED_TONE[badge.color]}`} aria-hidden>
                <badge.icon className="h-[22px] w-[22px]" strokeWidth={2} />
              </span>
            ) : (
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-dashed border-[#d6d3d1] text-[var(--ps-muted)] dark:border-[#3f3f46]"
                aria-hidden
              >
                <Lock className="h-[18px] w-[18px]" strokeWidth={2} />
              </span>
            )}
            <p className="mt-2 text-[12.5px] font-semibold leading-tight text-[var(--ps-title)]">{badge.name}</p>
            {!badge.unlocked && badge.requirement ? (
              <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--ps-muted)]">{badge.requirement}</p>
            ) : null}
            <span className="sr-only">{badge.unlocked ? "მოპოვებულია" : "ჯერ არ არის მოპოვებული"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
