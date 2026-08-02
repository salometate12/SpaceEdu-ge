import { Flame } from "lucide-react";
import type { StreakDay } from "@/lib/streak";

interface StreakTrackerProps {
  currentStreak: number;
  personalBest: number;
  week: StreakDay[];
}

const DAY_STYLE: Record<StreakDay["status"], string> = {
  done: "border-[var(--accent-purple)] bg-[var(--bg-secondary)] text-[var(--text-primary)]",
  today:
    "border-[var(--accent-amber)] bg-[var(--accent-amber)] text-slate-950 shadow-[0_0_16px_color-mix(in_oklab,var(--accent-amber),transparent_45%)]",
  missed: "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)]",
  upcoming: "border-[var(--border)] bg-transparent text-[var(--text-muted)]",
};

export function StreakTracker({
  currentStreak,
  personalBest,
  week,
}: StreakTrackerProps) {
  const isNewRecord = currentStreak > 0 && currentStreak >= personalBest;

  return (
    <section className="card relative overflow-hidden">
      <div
        className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full opacity-[0.14] blur-2xl"
        style={{ background: "var(--accent-amber)" }}
        aria-hidden
      />
      <div className="relative mb-4 flex items-center gap-2">
        <Flame className="h-5 w-5 text-[var(--accent-amber)]" />
        <h3 className="headline text-lg font-semibold">სტრიკი</h3>
      </div>

      <div className="relative mb-5 flex items-end gap-3">
        <span className="mono text-5xl font-bold leading-none text-[var(--accent-amber)]">
          {currentStreak}
        </span>
        <div className="pb-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            დღიანი სტრიკი
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {isNewRecord ? "🏆 ეს შენი პირადი რეკორდია!" : `პირადი რეკორდი: ${personalBest}`}
          </p>
        </div>
      </div>

      <div className="relative flex flex-wrap items-start gap-2.5">
        {week.map((day, idx) => (
          <div key={`${day.fullLabel}-${idx}`} className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${DAY_STYLE[day.status]}`}
              title={day.fullLabel}
            >
              {day.label}
            </div>
            <p className="text-[10px] font-medium leading-none text-[var(--text-muted)]">
              {day.fullLabel}
            </p>
          </div>
        ))}
      </div>

      <div className="relative mt-4 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <span>↗</span>
        <span className="leading-none">დღიური პროგრესი აქტიურია</span>
      </div>
    </section>
  );
}
