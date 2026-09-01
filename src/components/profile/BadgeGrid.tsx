import { getBadgeColor, type Badge } from "@/lib/badges";

interface BadgeGridProps {
  badges: Badge[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;

  return (
    <section className="dashboard-glass-card relative overflow-hidden rounded-[28px] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="headline text-lg font-bold text-[var(--text-primary)]">ბეჯები</h3>
        <span className="mono rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
          {unlockedCount} / {badges.length} მოპოვებული
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {badges.map((badge) => {
          const color = getBadgeColor(badge.color);
          return (
            <div
              key={badge.id}
              className={`rounded-2xl p-3.5 text-center transition-all ${
                badge.unlocked
                  ? "hover:-translate-y-0.5"
                  : "border border-[var(--border)] bg-[var(--bg-secondary)] opacity-60"
              }`}
              style={
                badge.unlocked
                  ? { background: `color-mix(in oklab, ${color}, white 88%)` }
                  : undefined
              }
              title={badge.unlocked ? badge.name : badge.requirement}
            >
              <p className="text-2xl leading-none">{badge.icon}</p>
              <p className="mt-1.5 text-xs font-semibold text-[var(--text-primary)]">{badge.name}</p>
              {!badge.unlocked && badge.requirement && (
                <p className="mt-0.5 text-[10px] leading-tight text-[var(--text-muted)]">
                  {badge.requirement}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
