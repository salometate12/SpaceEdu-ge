import { getBadgeColor, type Badge } from "@/lib/badges";

interface BadgeGridProps {
  badges: Badge[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;

  return (
    <section className="card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="headline text-lg font-semibold">ბეჯები</h3>
        <span className="mono text-xs text-[var(--text-muted)]">
          {unlockedCount} / {badges.length} მოპოვებული
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {badges.map((badge) => {
          const color = getBadgeColor(badge.color);
          return (
            <div
              key={badge.id}
              className={`rounded-xl border p-3 text-center transition-transform ${
                badge.unlocked ? "hover:-translate-y-0.5" : "opacity-50"
              }`}
              style={{
                borderColor: badge.unlocked
                  ? color
                  : "var(--border)",
                background: badge.unlocked
                  ? `color-mix(in oklab, ${color}, transparent 92%)`
                  : "var(--bg-secondary)",
              }}
              title={badge.unlocked ? badge.name : badge.requirement}
            >
              <p className="text-2xl leading-none">{badge.icon}</p>
              <p className="mt-1.5 text-xs font-medium">{badge.name}</p>
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
