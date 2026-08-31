"use client";

import { useEffect, useState } from "react";
import { Flame, Hourglass } from "lucide-react";
import { getCurrentStreak, STREAK_UPDATED_EVENT } from "@/lib/daily-streak";
import { getExamCountdownDays } from "@/lib/exam-countdown";

export type DashboardWorkspace = "abiturient" | "student";

interface DashboardBannerStatsProps {
  workspace: DashboardWorkspace;
}

const COUNTDOWN_LABEL: Record<DashboardWorkspace, string> = {
  abiturient: "გამოცდამდე დარჩა",
  student: "სესიებამდე დარჩა",
};

export function DashboardBannerStats({ workspace }: DashboardBannerStatsProps) {
  const [streak, setStreak] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setStreak(getCurrentStreak());
    sync();
    window.addEventListener(STREAK_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STREAK_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const sync = () => setCountdown(getExamCountdownDays());
    sync();
  }, []);

  const streakActiveToday = streak > 0;

  return (
    <div className="flex shrink-0 flex-row items-center gap-3 sm:gap-4">
      <div className="group flex items-center gap-3 rounded-xl border border-orange-200/70 bg-white/70 px-4 py-3 backdrop-blur-md transition-all duration-300 ease-in-out hover:border-orange-400/50 dark:border-white/5 dark:bg-[#13131A]/40 dark:hover:border-orange-500/20">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-500 transition-transform duration-300 dark:text-orange-400 ${
            streakActiveToday ? "group-hover:scale-110" : ""
          }`}
        >
          <Flame className="h-5 w-5" strokeWidth={2} fill={streakActiveToday ? "currentColor" : "none"} />
        </span>
        <div>
          <p className="mono text-2xl font-bold leading-none text-orange-500 dark:text-orange-400 dark:drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]">
            {streak}
          </p>
          <p className="mt-1 text-[11px] font-medium tracking-wide text-orange-600/80 dark:text-orange-400/80">
            დღიანი სტრიკი
          </p>
        </div>
      </div>
      <div className="group flex items-center gap-3 rounded-xl border border-cyan-200/70 bg-white/70 px-4 py-3 backdrop-blur-md transition-all duration-300 ease-in-out hover:border-cyan-400/50 dark:border-white/5 dark:bg-[#13131A]/40 dark:hover:border-cyan-500/20">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-600 transition-transform duration-300 group-hover:scale-110 dark:text-cyan-400">
          <Hourglass className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <p className="mono text-2xl font-bold leading-none text-cyan-600 dark:text-cyan-400 dark:drop-shadow-[0_0_12px_rgba(34,211,238,0.25)]">
            {countdown ?? "—"}
          </p>
          <p className="mt-1 max-w-[8rem] text-[11px] font-medium leading-tight tracking-wide text-cyan-700/80 dark:text-cyan-400/80">
            {COUNTDOWN_LABEL[workspace]}
          </p>
        </div>
      </div>
    </div>
  );
}
