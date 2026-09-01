import { Flame } from "lucide-react";

interface StreakTrackerProps {
  currentStreak: number;
  personalBest: number;
}

export function StreakTracker({ currentStreak, personalBest }: StreakTrackerProps) {
  const isNewRecord = currentStreak > 0 && currentStreak >= personalBest;

  return (
    <section className="dashboard-glass-card relative overflow-hidden rounded-[28px] p-6">
      <div className="relative mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100">
          <Flame className="h-4 w-4 text-orange-500" />
        </span>
        <h3 className="headline text-lg font-bold text-[var(--text-primary)]">სტრიკი</h3>
      </div>

      <div className="relative flex items-end gap-3">
        <span className="mono text-5xl font-extrabold leading-none text-orange-500">
          {currentStreak}
        </span>
        <div className="pb-1">
          <p className="text-sm font-bold text-[var(--text-primary)]">დღიანი სტრიკი</p>
          <p className="text-xs text-[var(--text-muted)]">
            {isNewRecord ? "🏆 ეს შენი პირადი რეკორდია!" : `პირადი რეკორდი: ${personalBest}`}
          </p>
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
        <span>↗</span>
        <span className="leading-none">დღიური პროგრესი აქტიურია</span>
      </div>
    </section>
  );
}
