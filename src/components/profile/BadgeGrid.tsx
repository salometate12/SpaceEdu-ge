import { Award } from "lucide-react";
import { getBadgeColor, type Badge } from "@/lib/badges";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

interface BadgeGridProps {
  badges: Badge[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;

  return (
    <DashboardCard icon={Award} tone="violet" title="ბეჯები" meta={`${unlockedCount}/${badges.length}`}>
      <ul className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {badges.map((badge) => {
          const color = getBadgeColor(badge.color);
          return (
            <li
              key={badge.id}
              className={`rounded-xl border border-[var(--border)] p-3 text-center ${
                badge.unlocked ? "" : "bg-[var(--bg-secondary)] opacity-60"
              }`}
              title={badge.unlocked ? badge.name : badge.requirement}
            >
              <span
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-secondary)]"
                style={
                  badge.unlocked
                    ? { background: `color-mix(in oklab, ${color}, transparent 85%)` }
                    : undefined
                }
                aria-hidden
              >
                <badge.icon
                  className="h-5 w-5"
                  strokeWidth={2}
                  style={{ color: badge.unlocked ? color : "var(--text-muted)" }}
                />
              </span>
              <p className="mt-2 text-xs font-semibold text-[var(--text-primary)]">{badge.name}</p>
              {!badge.unlocked && badge.requirement && (
                <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">
                  {badge.requirement}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
