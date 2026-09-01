import { getBadgeColor, type Badge } from "@/lib/badges";

interface BadgeGridProps {
  badges: Badge[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;

  return (
    <section className="dashboard-glass-card relative overflow-hidden rounded-[32px] p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="headline text-xl font-black text-[var(--text-primary)]">ბეჯები</h3>
        <span className="mono rounded-full bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)]">
          {unlockedCount} / {badges.length} მოპოვებული
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {badges.map((badge) => {
          const color = getBadgeColor(badge.color);
          return (
            <div
              key={badge.id}
              className={`rounded-[22px] p-4 text-center transition-transform ${
                badge.unlocked
                  ? "hover:-translate-y-1"
                  : "border border-[var(--border)] bg-[var(--bg-secondary)] opacity-60"
              }`}
              style={
                badge.unlocked
                  ? { background: `color-mix(in oklab, ${color}, white 82%)` }
                  : undefined
              }
              title={badge.unlocked ? badge.name : badge.requirement}
            >
              <p className="text-3xl leading-none">{badge.icon}</p>
              <p className="mt-2 text-xs font-black text-[var(--text-primary)]">{badge.name}</p>
              {!badge.unlocked && badge.requirement && (
                <p className="mt-0.5 text-[10px] font-medium leading-tight text-[var(--text-muted)]">
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
