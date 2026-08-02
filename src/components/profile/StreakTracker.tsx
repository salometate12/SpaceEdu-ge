import { Flame } from "lucide-react";
import type { StreakDay } from "@/lib/streak";

interface StreakTrackerProps {
  currentStreak: number;
  personalBest: number;
  week: StreakDay[];
}

const DAY_STYLE: Record<StreakDay["status"], string> = {
  done: "border-[#6C49FF] bg-[#10101A] text-[#C6B9FF]",
  today: "border-[#6C49FF] bg-[#6C49FF] text-white",
  missed: "border-[#5D3DDF] bg-[#141423] text-[#9E8CF9]",
  upcoming: "border-[#5D3DDF] bg-[#141423] text-[#9E8CF9]",
};

export function StreakTracker({
  currentStreak,
  personalBest,
  week,
}: StreakTrackerProps) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-5 text-[var(--text-primary)] shadow-[0_8px_30px_rgba(2,6,23,0.35)]">
      <div className="mb-4 flex items-center gap-2">
        <Flame className="h-5 w-5 text-[#F5A623]" />
        <h3 className="headline text-[30px] font-semibold leading-none tracking-tight">
          სტრიკი
        </h3>
      </div>

      <div className="mb-4 flex items-end gap-3">
        <span className="mono text-5xl font-bold leading-none text-[#F5A623]">
          {currentStreak}
        </span>
        <div className="pb-1">
          <p className="headline text-3xl font-semibold leading-tight text-[var(--text-primary)]">
            დღიანი სტრიკი
          </p>
          <p className="text-lg font-semibold text-[var(--text-secondary)]">
            პირადი რეკორდი: {personalBest}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-3">
        {week.map((day, idx) => (
          <div key={`${day.fullLabel}-${idx}`} className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl font-semibold ${DAY_STYLE[day.status]}`}
              title={day.fullLabel}
            >
              {day.label}
            </div>
            <p className="text-2xl font-semibold leading-none text-[var(--text-secondary)]">
              {day.fullLabel}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 hidden items-center gap-1.5 text-xs text-[var(--text-muted)] sm:inline-flex">
        <span>↗</span>
        <span className="leading-none">დღიური პროგრესი აქტიურია</span>
      </div>

      <div className="sr-only">
        <span className="mono text-xl font-semibold text-[var(--accent-amber)]">
            {currentStreak}
        </span>
      </div>
    </section>
  );
}
