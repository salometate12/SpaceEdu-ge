"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CalendarPlus,
  CalendarX,
  Check,
  ChevronDown,
  Clock,
  PartyPopper,
  Rocket,
} from "lucide-react";
import {
  getSavedStudyPlan,
  studyDayAsMilestone,
  studyDayCalendarId,
  toggleStudyPlanDayDone,
  STUDY_PLAN_CALENDAR_UPDATED_EVENT,
  studyPlanStatus,
  type SavedStudyPlan,
} from "@/lib/study-plan-calendar";
import {
  CALENDAR_UPDATED_EVENT,
  addMilestoneToDashboardCalendar,
  addMilestonesToDashboardCalendar,
  getDashboardCalendarEvents,
} from "@/lib/syllabus-calendar";
import { FOCUS_LEVEL_CONFIG } from "@/components/StudyPlan/focus-level-config";
import { DashboardCard, dashboardCardActionClass } from "./DashboardCard";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function StudentStudyCalendar() {
  const [plan, setPlan] = useState<SavedStudyPlan | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  /** Which plan days are already sitting on the dashboard calendar. */
  const [onCalendar, setOnCalendar] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    const sync = () =>
      setOnCalendar(new Set(getDashboardCalendarEvents().map((event) => event.id)));
    sync();
    window.addEventListener(CALENDAR_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CALENDAR_UPDATED_EVENT, sync);
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

  const status = plan ? studyPlanStatus(plan, today) : null;

  const isOnCalendar = (date: string) =>
    onCalendar.has(studyDayCalendarId("student", date));

  /** The upcoming days that have not been placed on the calendar yet. */
  const pendingDays = upcoming.filter((day) => !isOnCalendar(day.date));

  const addOneDay = (date: string) => {
    const day = upcoming.find((item) => item.date === date);
    if (!plan || !day) return;
    addMilestoneToDashboardCalendar(studyDayAsMilestone("student", plan.subject, day));
  };

  const addEveryDay = () => {
    if (!plan || pendingDays.length === 0) return;
    addMilestonesToDashboardCalendar(
      pendingDays.map((day) => studyDayAsMilestone("student", plan.subject, day)),
    );
  };

  const newPlanLink = (
    <Link href="/study-plan" className={dashboardCardActionClass}>
      <Rocket className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      {plan ? "ახალი გეგმა" : "გეგმის შექმნა"}
    </Link>
  );

  return (
    <DashboardCard
      icon={CalendarDays}
      title="შენი სასწავლო კალენდარი"
      subtitle={plan ? plan.subject : "შექმენი გეგმა — აქ თარიღების მიხედვით გამოჩნდება"}
      action={newPlanLink}
    >
      {plan && (
        <>
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
              <span className="font-medium tabular-nums text-[var(--text-secondary)]">
                {doneCount}/{plan.totalDays} დღე · {progressPct}%
              </span>
              {status === "active" &&
                (pendingDays.length === 0 ? (
                  <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                    კალენდარშია
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={addEveryDay}
                    className="inline-flex items-center gap-1 rounded-md font-medium text-[var(--accent-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    კალენდარში დამატება ({pendingDays.length})
                  </button>
                ))}
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPct}
              aria-label="გეგმის პროგრესი"
            >
              <div
                className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {status === "complete" ? (
            <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--text-secondary)]">
              <PartyPopper className="h-4 w-4 text-[var(--accent-primary)]" strokeWidth={1.75} aria-hidden />
              გეგმა დასრულებულია.
              <Link href="/study-plan" className="font-medium text-[var(--accent-primary)] hover:underline">
                შექმენი ახალი გეგმა
              </Link>
            </p>
          ) : status === "expired" ? (
            <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--text-secondary)]">
              <CalendarX className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.75} aria-hidden />
              გეგმის ვადა ამოიწურა — {doneCount}/{plan.totalDays} დღე შესრულდა.
              <Link href="/study-plan" className="font-medium text-[var(--accent-primary)] hover:underline">
                შექმენი ახალი გეგმა
              </Link>
            </p>
          ) : (
            <>
              <div className="-mx-1 mt-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-track]:bg-transparent">
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
                      className={`flex w-[172px] shrink-0 snap-start cursor-pointer flex-col gap-1.5 rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50 ${
                        isExpanded
                          ? "border-[var(--accent-primary)] bg-[var(--bg-card)]"
                          : isToday
                            ? "border-[var(--accent-primary)]/40 bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)]"
                            : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)]"
                      } ${done ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            isToday ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"
                          }`}
                        >
                          {isToday ? "დღეს" : day.day_name}
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleStudyPlanDayDone("student", day.date);
                          }}
                          aria-label={done ? "მონიშნე დაუსრულებლად" : "მონიშნე დასრულებულად"}
                          aria-pressed={done}
                          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors active:scale-90 ${
                            done
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                              : "border-[var(--border-hover)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                      <span className="flex items-center gap-1.5 text-xs tabular-nums text-[var(--text-muted)]">
                        {day.date}
                        {isOnCalendar(day.date) && (
                          <CalendarPlus
                            className="h-3 w-3"
                            strokeWidth={2.25}
                            aria-label="კალენდარშია"
                          />
                        )}
                      </span>

                      <p
                        className={`line-clamp-2 text-sm font-medium leading-snug text-[var(--text-primary)] ${
                          done ? "line-through decoration-[var(--text-muted)]" : ""
                        }`}
                      >
                        {day.topics.join(", ")}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-1 text-xs text-[var(--text-secondary)]">
                        <span className="inline-flex items-center gap-1">
                          <LevelIcon className="h-3 w-3 text-[var(--text-muted)]" strokeWidth={2} aria-hidden />
                          {level.label} · {day.hours} სთ
                        </span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          strokeWidth={2}
                          aria-hidden
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {!expandedDay && (
                <p className="mt-1 text-xs text-[var(--text-muted)]">დააკლიკე დღეს დეტალებისთვის</p>
              )}

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
                        <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 sm:p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                              {isToday ? "დღეს" : expandedDay.day_name}
                            </span>
                            <span className="text-xs tabular-nums text-[var(--text-muted)]">{expandedDay.date}</span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-0.5 text-xs text-[var(--text-secondary)]">
                              <LevelIcon className="h-3 w-3" strokeWidth={2} aria-hidden />
                              {level.label}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-0.5 text-xs text-[var(--text-secondary)]">
                              <Clock className="h-3 w-3" strokeWidth={2} aria-hidden />
                              {expandedDay.hours} საათი
                            </span>
                          </div>

                          <ul className="mt-3 space-y-1.5">
                            {expandedDay.topics.map((topic) => (
                              <li
                                key={topic}
                                className="flex items-start gap-2 text-sm leading-normal text-[var(--text-primary)]"
                              >
                                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--text-muted)]" />
                                {topic}
                              </li>
                            ))}
                          </ul>

                          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            <button
                              type="button"
                              onClick={() => toggleStudyPlanDayDone("student", expandedDay.date)}
                              className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition active:scale-[0.98] ${
                                done
                                  ? "border border-[var(--accent-primary)]/40 text-[var(--accent-primary)]"
                                  : "bg-[var(--accent-primary)] text-white hover:opacity-90"
                              }`}
                            >
                              <Check className="h-4 w-4" strokeWidth={2.5} />
                              {done ? "დასრულებულია" : "მონიშნე დასრულებულად"}
                            </button>

                            {/* One day on its own — the whole plan is not
                                always what someone wants in their calendar. */}
                            {isOnCalendar(expandedDay.date) ? (
                              <span className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--text-secondary)]">
                                <Check className="h-4 w-4" strokeWidth={2.5} />
                                კალენდარშია
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addOneDay(expandedDay.date)}
                                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] active:scale-[0.98]"
                              >
                                <CalendarPlus className="h-4 w-4" strokeWidth={2} />
                                ამ დღის დამატება
                              </button>
                            )}
                          </div>
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
    </DashboardCard>
  );
}
