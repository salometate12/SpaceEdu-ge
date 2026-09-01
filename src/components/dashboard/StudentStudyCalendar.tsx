"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, Clock, PartyPopper, Rocket } from "lucide-react";
import {
  getSavedStudyPlan,
  toggleStudyPlanDayDone,
  STUDY_PLAN_CALENDAR_UPDATED_EVENT,
  type SavedStudyPlan,
} from "@/lib/study-plan-calendar";
import { FOCUS_LEVEL_CONFIG } from "@/components/StudyPlan/focus-level-config";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function StudentStudyCalendar() {
  const [plan, setPlan] = useState<SavedStudyPlan | null>(null);

  useEffect(() => {
    const sync = () => setPlan(getSavedStudyPlan("student"));
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
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [plan, today]);

  const doneCount = plan?.doneDates.length ?? 0;

  const progressPct =
    plan && plan.totalDays > 0
      ? Math.min(100, Math.round((doneCount / plan.totalDays) * 100))
      : 0;

  const finished = Boolean(plan) && upcoming.length === 0 && doneCount > 0;

  return (
    <section className="dashboard-tool-card rounded-[32px] p-6 sm:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="headline flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/10 text-violet-700 dark:bg-white/20 dark:text-white">
              <CalendarDays className="h-4 w-4 stroke-[2]" />
            </span>
            შენი სასწავლო კალენდარი
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {plan
              ? `${plan.subject} — გეგმა თარიღების მიხედვით`
              : "შექმენი სასწავლო გეგმა და გადაიტანე აქ კალენდრული ხედვისთვის."}
          </p>
        </div>
        <Link
          href="/study-plan"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 px-3 py-2 text-xs font-medium text-[var(--accent-primary)] transition hover:bg-[var(--accent-primary)]/15"
        >
          <Rocket className="h-3.5 w-3.5" strokeWidth={2} />
          {plan ? "ახალი გეგმა" : "გეგმის შექმნა"}
        </Link>
      </div>

      {!plan ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] px-4 py-10 text-center">
          <CalendarDays className="h-6 w-6 text-[var(--text-muted)]" strokeWidth={1.5} />
          <p className="max-w-sm text-sm text-[var(--text-muted)]">
            სასწავლო გეგმის გენერატორში შექმნილი გეგმა, „გადატანა კალენდარში“ ღილაკით, აქ
            გამოჩნდება თარიღების მიხედვით.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5">
            <span className="text-lg" aria-hidden>
              {finished ? "🏆" : progressPct === 0 ? "🌱" : "🔥"}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
                <span>
                  {doneCount}/{plan.totalDays} დღე შესრულებული
                </span>
                <span>{progressPct}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {finished ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-emerald-300/50 bg-emerald-50/60 px-4 py-8 text-center dark:border-emerald-500/25 dark:bg-emerald-500/[0.06]">
              <PartyPopper className="h-6 w-6 text-emerald-500 dark:text-emerald-300" strokeWidth={1.75} />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-200">
                გეგმა დასრულებულია — შექმენი ახალი მომდევნო ეტაპისთვის!
              </p>
            </div>
          ) : (
            <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-track]:bg-transparent">
              {upcoming.map((day) => {
                const level = FOCUS_LEVEL_CONFIG[day.focus_level];
                const LevelIcon = level.icon;
                const isToday = day.date === today;
                const done = Boolean(plan?.doneDates.includes(day.date));
                return (
                  <div
                    key={`${day.date}-${day.day_name}`}
                    className={`flex w-[190px] shrink-0 snap-start flex-col gap-2 rounded-[20px] border-t-4 ${level.accent} border-[var(--border)] bg-[var(--bg-card)] p-3 transition-opacity ${
                      done ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${level.iconWrap}`}
                        aria-hidden
                      >
                        <LevelIcon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleStudyPlanDayDone("student", day.date)}
                        aria-label={done ? "მონიშნე დაუსრულებლად" : "მონიშნე დასრულებულად"}
                        aria-pressed={done}
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all active:scale-90 ${
                          done
                            ? "border-emerald-400/60 bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
                            : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                        }`}
                      >
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {isToday ? (
                        <span className="rounded-full bg-[var(--accent-primary)] px-2 py-0.5 text-[11px] font-semibold text-white">
                          დღეს
                        </span>
                      ) : (
                        <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                          {day.day_name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">{day.date}</span>

                    <p
                      className={`line-clamp-2 text-sm font-medium text-[var(--text-primary)] ${
                        done ? "line-through decoration-[var(--text-muted)]" : ""
                      }`}
                    >
                      {day.topics.join(", ")}
                    </p>
                    <p className="mt-auto inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                      <Clock className="h-3 w-3" strokeWidth={2} />
                      {day.hours} საათი
                    </p>
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
