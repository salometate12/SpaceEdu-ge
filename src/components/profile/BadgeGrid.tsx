import { getBadgeColor, type Badge } from "@/lib/badges";

interface BadgeGridProps {
  badges: Badge[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  return (
    <section className="card">
      <h3 className="headline mb-4 text-lg font-semibold">ბეჯები</h3>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`rounded-lg border p-3 text-center ${
              badge.unlocked ? "" : "opacity-35"
            }`}
            style={{ borderColor: badge.unlocked ? getBadgeColor(badge.color) : "var(--border-hover)" }}
            title={badge.unlocked ? badge.name : badge.requirement}
          >
            <p className="text-xl">{badge.icon}</p>
            <p className="mt-1 text-xs">{badge.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
