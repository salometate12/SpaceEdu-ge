"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  PartyPopper,
  Rocket,
} from "lucide-react";
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
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

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

  const expandedDay = upcoming.find((day) => day.date === expandedDate) ?? null;

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
              ? `${plan.subject} — დააკლიკე დღეს დეტალების სანახავად`
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
            <>
              <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-track]:bg-transparent">
                {upcoming.map((day) => {
                  const level = FOCUS_LEVEL_CONFIG[day.focus_level];
                  const LevelIcon = level.icon;
                  const isToday = day.date === today;
                  const done = Boolean(plan?.doneDates.includes(day.date));
                  const isExpanded = expandedDate === day.date;
                  return (
                    <div
                      key={`${day.date}-${day.day_name}`}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-label={`დღის დეტალები — ${day.day_name}`}
                      onClick={() =>
                        setExpandedDate((prev) => (prev === day.date ? null : day.date))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setExpandedDate((prev) => (prev === day.date ? null : day.date));
                        }
                      }}
                      className={`relative flex w-[190px] shrink-0 snap-start cursor-pointer flex-col gap-2 overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)] p-3 pt-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                        done ? "opacity-60" : ""
                      } ${isExpanded ? "ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-card)]" : ""}`}
                    >
                      <span aria-hidden className={`absolute inset-x-0 top-0 h-[3px] ${level.bar}`} />
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${level.iconWrap}`}
                          aria-hidden
                        >
                          <LevelIcon className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleStudyPlanDayDone("student", day.date);
                          }}
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
                      <div className="mt-auto flex items-center justify-between text-xs text-[var(--text-secondary)]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" strokeWidth={2} />
                          {day.hours} საათი
                        </span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          strokeWidth={2}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <AnimatePresence initial={false}>
                {expandedDay && (
                  <motion.div
                    key={expandedDay.date}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    {(() => {
                      const level = FOCUS_LEVEL_CONFIG[expandedDay.focus_level];
                      const LevelIcon = level.icon;
                      const done = Boolean(plan?.doneDates.includes(expandedDay.date));
                      const isToday = expandedDay.date === today;
                      return (
                        <div
                          className="relative mt-3 overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--bg-secondary)] p-4 pl-5 sm:p-5 sm:pl-6"
                        >
                          <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${level.bar}`} />
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`flex h-9 w-9 items-center justify-center rounded-full ${level.iconWrap}`}
                              aria-hidden
                            >
                              <LevelIcon className="h-4 w-4" strokeWidth={2} />
                            </span>
                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                              {isToday ? "დღეს" : expandedDay.day_name}
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">{expandedDay.date}</span>
                            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                              {level.label}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                              <Clock className="h-3 w-3" strokeWidth={2} />
                              {expandedDay.hours} საათი
                            </span>
                          </div>

                          <ul className="mt-4 space-y-2">
                            {expandedDay.topics.map((topic) => (
                              <li
                                key={topic}
                                className="flex items-start gap-2 text-sm text-[var(--text-primary)]"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-primary)]" />
                                {topic}
                              </li>
                            ))}
                          </ul>

                          <button
                            type="button"
                            onClick={() => toggleStudyPlanDayDone("student", expandedDay.date)}
                            className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
                              done
                                ? "bg-emerald-500 text-white"
                                : "bg-[var(--accent-primary)] text-white hover:opacity-90"
                            }`}
                          >
                            <Check className="h-4 w-4" strokeWidth={2.5} />
                            {done ? "დასრულებულია" : "მონიშნე დასრულებულად"}
                          </button>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </>
      )}
    </section>
  );
}
