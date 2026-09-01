import { Flame, Trophy } from "lucide-react";

interface StreakTrackerProps {
  currentStreak: number;
  personalBest: number;
}

export function StreakTracker({ currentStreak, personalBest }: StreakTrackerProps) {
  const isNewRecord = currentStreak > 0 && currentStreak >= personalBest;

  return (
    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 p-6">
      <div className="relative flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 shadow-sm">
          <Flame className="h-6 w-6 text-orange-500" fill="currentColor" />
        </span>
        <h3 className="headline text-xl font-black text-[#7c2d12]">სტრიკი</h3>
      </div>

      <div className="relative mt-5 flex items-end gap-3">
        <span className="mono text-6xl font-black leading-none text-orange-500">
          {currentStreak}
        </span>
        <div className="pb-1.5">
          <p className="text-sm font-black text-[#7c2d12]">დღიანი სტრიკი</p>
          <p className="flex items-center gap-1 text-xs font-bold text-[#9a3412]/70">
            {isNewRecord ? (
              <>
                <Trophy className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                ეს შენი პირადი რეკორდია!
              </>
            ) : (
              `პირადი რეკორდი: ${personalBest}`
            )}
          </p>
        </div>
      </div>

      <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5 text-xs font-bold text-[#7c2d12]">
        <span>↗</span>
        <span className="leading-none">დღიური პროგრესი აქტიურია</span>
      </div>
    </section>
  );
}
