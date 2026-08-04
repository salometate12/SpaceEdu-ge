"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, PartyPopper, Rocket } from "lucide-react";
import {
  getSavedStudyPlan,
  STUDY_PLAN_CALENDAR_UPDATED_EVENT,
  type SavedStudyPlan,
} from "@/lib/study-plan-calendar";
import { FOCUS_LEVEL_CONFIG } from "@/components/StudyPlan/focus-level-config";

const UPCOMING_LIMIT = 6;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AbiturientStudyCalendar() {
  const [plan, setPlan] = useState<SavedStudyPlan | null>(null);

  useEffect(() => {
    const sync = () => setPlan(getSavedStudyPlan());
    sync();
    window.addEventListener(STUDY_PLAN_CALENDAR_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STUDY_PLAN_CALENDAR_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const today = todayIso();

  const upcoming = useMemo(() => {
    if (!plan) return [];
    return [...plan.days]
      .filter((day) => day.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, UPCOMING_LIMIT);
  }, [plan, today]);

  const elapsedCount = useMemo(() => {
    if (!plan) return 0;
    return plan.days.filter((day) => day.date < today).length;
  }, [plan, today]);

  const progressPct =
    plan && plan.totalDays > 0
      ? Math.min(100, Math.round((elapsedCount / plan.totalDays) * 100))
      : 0;

  const finished = Boolean(plan) && upcoming.length === 0 && elapsedCount > 0;

  return (
    <section className="dashboard-section p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 sm:text-xl dark:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-purple-500/15 dark:text-purple-300">
              <CalendarDays className="h-4.5 w-4.5" strokeWidth={2} />
            </span>
            შენი სასწავლო კალენდარი
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
            {plan
              ? `${plan.subject} — გეგმა თარიღების მიხედვით`
              : "შექმენი სასწავლო გეგმა და გადაიტანე აქ კალენდრული ხედვისთვის."}
          </p>
        </div>
        <Link
          href="/study-plan/abit"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-violet-300/60 bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700 transition hover:bg-violet-100 dark:border-purple-500/25 dark:bg-purple-500/10 dark:text-purple-200 dark:hover:bg-purple-500/20"
        >
          <Rocket className="h-3.5 w-3.5" strokeWidth={2} />
          {plan ? "ახალი გეგმა" : "გეგმის შექმნა"}
        </Link>
      </div>

      {!plan ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-white/[0.08]">
          <CalendarDays className="h-6 w-6 text-slate-300 dark:text-zinc-600" strokeWidth={1.5} />
          <p className="max-w-sm text-sm text-slate-500 dark:text-zinc-500">
            სასწავლო გეგმის გენერატორში შექმნილი გეგმა, „გადატანა კალენდარში“ ღილაკით, აქ
            გამოჩნდება თარიღების მიხედვით.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-violet-200/60 bg-violet-50/50 px-3 py-2.5 dark:border-purple-500/20 dark:bg-purple-500/[0.06]">
            <span className="text-lg" aria-hidden>
              {finished ? "🏆" : progressPct === 0 ? "🌱" : "🔥"}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs font-medium text-violet-700 dark:text-purple-200">
                <span>
                  {elapsedCount}/{plan.totalDays} დღე გავლილია
                </span>
                <span>{progressPct}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-violet-100 dark:bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500 dark:from-purple-500 dark:to-indigo-400"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {finished ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-emerald-300/50 bg-emerald-50/60 px-4 py-8 text-center dark:border-emerald-500/25 dark:bg-emerald-500/[0.06]">
              <PartyPopper className="h-6 w-6 text-emerald-500 dark:text-emerald-300" strokeWidth={1.75} />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-200">
                გეგმა დასრულებულია — შექმენი ახალი მომდევნო ეტაპისთვის!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcoming.map((day) => {
                const level = FOCUS_LEVEL_CONFIG[day.focus_level];
                const LevelIcon = level.icon;
                const isToday = day.date === today;
                return (
                  <div
                    key={`${day.date}-${day.day_name}`}
                    className={`flex items-start gap-3 rounded-xl border border-l-4 ${level.accent} border-slate-200/80 bg-gradient-to-r from-white to-violet-50/30 p-3 dark:border-white/[0.08] dark:bg-none dark:bg-[#17181b]/80`}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${level.iconWrap}`}
                      aria-hidden
                    >
                      <LevelIcon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        {isToday ? (
                          <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-purple-500">
                            დღეს
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-white/[0.06] dark:text-zinc-400">
                            {day.day_name}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 dark:text-zinc-500">{day.date}</span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-zinc-100">
                        {day.topics.join(", ")}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-600 dark:text-zinc-400">
                        <Clock className="h-3 w-3" strokeWidth={2} />
                        {day.hours} საათი
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
