"use client";

import { useEffect, useState } from "react";
import { Check, Flame, Trophy } from "lucide-react";
import {
  getActiveDatesThisWeek,
  getCurrentStreak,
  getLongestStreak,
  getTotalActiveDays,
  STREAK_UPDATED_EVENT,
} from "@/lib/daily-streak";
import { getToolUsageEvents } from "@/lib/activity";
import {
  DASHBOARD_METRICS_UPDATED_EVENT,
  readQuizAttempts,
} from "@/lib/dashboard-metrics";

const WEEK_LABELS = ["ო", "ს", "ო", "ხ", "პ", "შ", "კ"];

interface StreakState {
  current: number;
  best: number;
  weekDone: boolean[];
  todayIndex: number;
  totalDays: number;
  quizzes: number;
  toolOpens: number;
}

function readStreakState(): StreakState {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  const active = new Set(getActiveDatesThisWeek());
  const weekDone = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return active.has(d.toISOString().slice(0, 10));
  });

  return {
    current: getCurrentStreak(),
    best: getLongestStreak(),
    weekDone,
    todayIndex: (new Date().getDay() + 6) % 7,
    totalDays: getTotalActiveDays(),
    quizzes: readQuizAttempts().length,
    toolOpens: getToolUsageEvents().length,
  };
}

const EMPTY: StreakState = {
  current: 0,
  best: 0,
  weekDone: [false, false, false, false, false, false, false],
  todayIndex: 0,
  totalDays: 0,
  quizzes: 0,
  toolOpens: 0,
};

export function StreakTracker() {
  const [state, setState] = useState<StreakState>(EMPTY);

  useEffect(() => {
    const refresh = () => setState(readStreakState());
    refresh();
    window.addEventListener(STREAK_UPDATED_EVENT, refresh);
    window.addEventListener(DASHBOARD_METRICS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(STREAK_UPDATED_EVENT, refresh);
      window.removeEventListener(DASHBOARD_METRICS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const isRecord = state.current > 0 && state.current >= state.best;

  const stats = [
    { label: "აქტიური დღე", value: state.totalDays },
    { label: "ქვიზი", value: state.quizzes },
    { label: "ხელსაწყო", value: state.toolOpens },
  ];

  return (
    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-orange-100 via-amber-50 to-orange-50 p-6 sm:p-7 dark:from-orange-500/10 dark:via-amber-500/[0.06] dark:to-orange-500/10">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_-8px_rgba(249,115,22,0.5)] dark:bg-white/10">
          <Flame className="h-8 w-8 text-orange-500" fill="currentColor" />
        </span>
        <p className="mono mt-3 text-5xl font-black leading-none text-[#7c2d12] sm:text-6xl dark:text-orange-300">
          {state.current}
        </p>
        <p className="mt-2 text-base font-black text-[#7c2d12] dark:text-orange-200">
          {state.current === 0 ? "სტრიკი ჯერ არ დაწყებულა" : `${state.current} დღიანი სტრიკი`}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs font-bold text-[#9a3412]/70 dark:text-orange-300/70">
          {isRecord && state.current > 0 ? (
            <>
              <Trophy className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
              ეს შენი პირადი რეკორდია!
            </>
          ) : (
            `პირადი რეკორდი: ${state.best}`
          )}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEK_LABELS.map((label, i) => {
          const done = state.weekDone[i];
          const isToday = i === state.todayIndex;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span
                className={`text-[11px] font-bold uppercase ${
                  isToday ? "text-[#7c2d12] dark:text-orange-200" : "text-[#9a3412]/50 dark:text-orange-300/40"
                }`}
              >
                {label}
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors sm:h-9 sm:w-9 ${
                  done
                    ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-sm"
                    : isToday
                      ? "border-2 border-dashed border-orange-400/70 text-orange-500"
                      : "bg-white/70 text-transparent dark:bg-white/5"
                }`}
              >
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t border-orange-200/70 pt-4 dark:border-orange-400/15">
        <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-widest text-[#9a3412]/60 dark:text-orange-300/50">
          შენი სტატისტიკა
        </p>
        <div className="grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-white/70 px-2 py-3 text-center dark:bg-white/5"
            >
              <p className="mono text-2xl font-black text-[#7c2d12] dark:text-orange-200">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[10px] font-bold text-[#9a3412]/70 dark:text-orange-300/60">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
