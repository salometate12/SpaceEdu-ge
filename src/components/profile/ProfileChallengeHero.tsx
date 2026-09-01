import { DEFAULT_BADGES, getBadgeColor } from "@/lib/badges";
import type { UserProfile } from "@/lib/profile";
import type { StreakDay } from "@/lib/streak";

interface ProfileChallengeHeroProps {
  user: UserProfile;
  week: StreakDay[];
  goalsRemaining: number;
}

const DAY_PILL_STYLE: Record<StreakDay["status"], string> = {
  done: "border-transparent bg-[#1c1917] text-white",
  today: "border-transparent bg-[#1c1917] text-white shadow-[0_4px_14px_rgba(28,25,23,0.35)]",
  missed: "border-[#e4d8bd] bg-white/70 text-[#8a7a52]",
  upcoming: "border-[#e4d8bd] bg-white/70 text-[#8a7a52]",
};

export function ProfileChallengeHero({ user, week, goalsRemaining }: ProfileChallengeHeroProps) {
  const firstName = user.name.split(" ")[0];
  const unlockedBadges = DEFAULT_BADGES.filter((badge) => badge.unlocked).slice(0, 4);
  const extraBadges = DEFAULT_BADGES.filter((badge) => badge.unlocked).length - unlockedBadges.length;

  return (
    <section className="space-y-4">
      <div className="profile-challenge-hero relative overflow-hidden rounded-[32px] p-6 sm:p-8">
        <div className="profile-challenge-blob profile-challenge-blob-1" aria-hidden />
        <div className="profile-challenge-blob profile-challenge-blob-2" aria-hidden />
        <div className="profile-challenge-blob profile-challenge-blob-3" aria-hidden />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-sm font-bold text-[#4c1d95] shadow-sm">
              {user.initials}
            </div>
            <h1 className="headline mt-4 text-3xl font-extrabold leading-tight tracking-tight text-[#1c1917] sm:text-4xl">
              მოგესალმები,
              <br />
              {firstName}!
            </h1>
            <p className="mt-2 max-w-xs text-sm font-medium text-[#4c1d95]/80">
              {goalsRemaining > 0
                ? `დღეს დაგრჩა ${goalsRemaining} მიზანი — გააგრძელე სტრიკი!`
                : "დღევანდელი მიზნები დასრულებულია — კარგი მუშაობა!"}
            </p>
          </div>
        </div>

        <div className="relative mt-6 flex items-center gap-2">
          <div className="flex -space-x-2.5">
            {unlockedBadges.map((badge) => (
              <span
                key={badge.id}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/80 text-base shadow-sm"
                style={{ background: `color-mix(in oklab, ${getBadgeColor(badge.color)}, white 70%)` }}
                title={badge.name}
              >
                {badge.icon}
              </span>
            ))}
            {extraBadges > 0 && (
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/80 bg-[#1c1917] text-xs font-bold text-white shadow-sm">
                +{extraBadges}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-[#4c1d95]/70">მოპოვებული ბეჯები</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {week.map((day, idx) => (
          <div
            key={`${day.fullLabel}-${idx}`}
            className={`flex shrink-0 flex-col items-center gap-1 rounded-[20px] border px-3.5 py-2.5 transition-colors ${DAY_PILL_STYLE[day.status]}`}
            title={day.fullLabel}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
              {day.label}
            </span>
            {day.status === "done" ? (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-transparent" aria-hidden />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
