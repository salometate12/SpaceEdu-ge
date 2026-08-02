import { Flame } from "lucide-react";
import type { StreakDay } from "@/lib/streak";

interface StreakTrackerProps {
  currentStreak: number;
  personalBest: number;
  week: StreakDay[];
}

const DAY_STYLE: Record<StreakDay["status"], string> = {
  done: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
  today:
    "border-amber-400 bg-amber-400 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.5)]",
  missed: "border-white/[0.08] bg-white/[0.02] text-zinc-600",
  upcoming: "border-white/[0.08] bg-transparent text-zinc-600",
};

export function StreakTracker({
  currentStreak,
  personalBest,
  week,
}: StreakTrackerProps) {
  const isNewRecord = currentStreak > 0 && currentStreak >= personalBest;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#13131A]/60 p-6 backdrop-blur-xl transition-colors hover:border-white/[0.15]">
      <div
        className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full opacity-[0.16] blur-3xl"
        style={{
          background: "radial-gradient(circle, #F59E0B 0%, transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative mb-4 flex items-center gap-2">
        <Flame className="h-5 w-5 text-amber-400" />
        <h3 className="headline text-lg font-semibold text-white">სტრიკი</h3>
      </div>

      <div className="relative mb-5 flex items-end gap-3">
        <span className="mono text-5xl font-bold leading-none text-amber-400">
          {currentStreak}
        </span>
        <div className="pb-1">
          <p className="text-sm font-semibold text-white">დღიანი სტრიკი</p>
          <p className="text-xs text-zinc-500">
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
            <p className="text-[10px] font-medium leading-none text-zinc-600">
              {day.fullLabel}
            </p>
          </div>
        ))}
      </div>

      <div className="relative mt-4 flex items-center gap-1.5 text-xs text-zinc-600">
        <span>↗</span>
        <span className="leading-none">დღიური პროგრესი აქტიურია</span>
      </div>
    </section>
  );
}
