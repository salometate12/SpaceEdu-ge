import { getBadgeColor, type Badge } from "@/lib/badges";

interface BadgeGridProps {
  badges: Badge[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#13131A]/60 p-6 backdrop-blur-xl transition-colors hover:border-white/[0.15]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="headline text-lg font-semibold text-white">ბეჯები</h3>
        <span className="mono rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-400">
          {unlockedCount} / {badges.length} მოპოვებული
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {badges.map((badge) => {
          const color = getBadgeColor(badge.color);
          return (
            <div
              key={badge.id}
              className={`rounded-xl border p-3.5 text-center transition-all ${
                badge.unlocked
                  ? "hover:-translate-y-0.5"
                  : "border-white/[0.06] bg-white/[0.015] opacity-60"
              }`}
              style={
                badge.unlocked
                  ? {
                      borderColor: `color-mix(in oklab, ${color}, transparent 55%)`,
                      background: `color-mix(in oklab, ${color}, transparent 92%)`,
                      boxShadow: `0 0 20px color-mix(in oklab, ${color}, transparent 80%)`,
                    }
                  : undefined
              }
              title={badge.unlocked ? badge.name : badge.requirement}
            >
              <p className="text-2xl leading-none">{badge.icon}</p>
              <p className="mt-1.5 text-xs font-medium text-zinc-200">{badge.name}</p>
              {!badge.unlocked && badge.requirement && (
                <p className="mt-0.5 text-[10px] leading-tight text-zinc-600">
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
