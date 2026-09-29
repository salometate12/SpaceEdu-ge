import { DEFAULT_BADGES, getBadgeColor } from "@/lib/badges";
import type { UserProfile } from "@/lib/profile";
import { HeroStreakNote } from "./HeroStreakNote";

interface ProfileChallengeHeroProps {
  user: UserProfile;
}

export function ProfileChallengeHero({ user }: ProfileChallengeHeroProps) {
  const firstName = user.name.split(" ")[0];
  const unlockedBadges = DEFAULT_BADGES.filter((badge) => badge.unlocked).slice(0, 4);
  const extraBadges = DEFAULT_BADGES.filter((badge) => badge.unlocked).length - unlockedBadges.length;

  return (
    <section>
      <div className="profile-challenge-hero relative overflow-hidden rounded-[32px] p-6 sm:p-8">
        <div className="profile-challenge-blob profile-challenge-blob-1" aria-hidden />
        <div className="profile-challenge-blob profile-challenge-blob-2" aria-hidden />
        <div className="profile-challenge-blob profile-challenge-blob-3" aria-hidden />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--accent-primary)] text-sm font-black text-white shadow-md ring-4 ring-white/70">
                {user.initials}
              </div>
              <span className="rounded-full bg-white/75 px-2.5 py-1 text-[11px] font-semibold text-[#4c1d95] shadow-sm">
                სტუდენტის სივრცე
              </span>
            </div>
            <h1 className="headline mt-4 text-3xl font-extrabold leading-tight tracking-tight text-[#1c1917] sm:text-4xl">
              მოგესალმები,
              <br />
              {firstName}!
            </h1>
            <p className="mt-2 max-w-xs text-sm font-medium text-[#4c1d95]/80">
              დაისახე დღევანდელი მიზნები და შეინარჩუნე სტრიკი.
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
          <HeroStreakNote className="ml-2 text-[#4c1d95]/80" />
        </div>
      </div>
    </section>
  );
}
