import { Check } from "lucide-react";
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
  today: "border-transparent bg-[#1c1917] text-white shadow-[0_8px_20px_rgba(28,25,23,0.35)]",
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
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--accent-primary)] text-sm font-black text-white shadow-md ring-4 ring-white/70">
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
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/80 shadow-sm"
                style={{ background: `color-mix(in oklab, ${getBadgeColor(badge.color)}, white 70%)` }}
                title={badge.name}
              >
                <badge.icon
                  className="h-4 w-4 stroke-[2.25]"
                  style={{ color: getBadgeColor(badge.color) }}
                />
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

      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {week.map((day, idx) => (
          <div
            key={`${day.fullLabel}-${idx}`}
            className={`flex min-w-0 flex-col items-center gap-2.5 rounded-[22px] border px-2 py-5 transition-colors sm:rounded-[26px] sm:px-3 sm:py-6 ${DAY_PILL_STYLE[day.status]}`}
            title={day.fullLabel}
          >
            <span className="text-xs font-bold uppercase tracking-wide opacity-80 sm:text-sm">
              {day.fullLabel}
            </span>
            {day.status === "done" ? (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 sm:h-7 sm:w-7">
                <Check className="h-3.5 w-3.5 text-[#1c1917] sm:h-4 sm:w-4" strokeWidth={3} />
              </span>
            ) : (
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-current opacity-30" aria-hidden />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
