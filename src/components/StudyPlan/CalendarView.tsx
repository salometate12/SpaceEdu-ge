"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CalendarPlus, Check, Clock } from "lucide-react";
import { SyllabusEventsPanel } from "@/components/syllabus/SyllabusEventsPanel";
import { DayCard } from "./DayCard";
import { FOCUS_LEVEL_CONFIG } from "./focus-level-config";
import { saveStudyPlanToDashboard, type StudyPlanSpace } from "@/lib/study-plan-calendar";
import { recordDailyActivity } from "@/lib/daily-streak";

interface StudyDay {
  date: string;
  day_name: string;
  topics: string[];
  hours: number;
  tasks: string[];
  focus_level: "high" | "medium" | "review";
}

interface CalendarViewProps {
  plan: StudyDay[];
  totalDays: number;
  advice: string;
  subject?: string;
  space: StudyPlanSpace;
}

export function CalendarView({ plan, totalDays, advice, subject, space }: CalendarViewProps) {
  const [doneDays, setDoneDays] = useState<Record<string, boolean>>({});
  const [savedToDashboard, setSavedToDashboard] = useState(false);

  const handleSaveToDashboard = () => {
    saveStudyPlanToDashboard(space, subject?.trim() || "სასწავლო გეგმა", plan, totalDays);
    setSavedToDashboard(true);
  };

  const compactPlan = useMemo(() => plan.slice(0, 14), [plan]);

  const doneCount = compactPlan.filter(
    (day) => doneDays[`${day.date}-${day.day_name}`],
  ).length;
  const progressPct =
    compactPlan.length > 0 ? Math.round((doneCount / compactPlan.length) * 100) : 0;

  return (
    <section className="h-full">
      <SyllabusEventsPanel />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-[var(--accent-primary)] dark:bg-pink-400/10 dark:text-pink-300"
            aria-hidden
          >
            <CalendarDays className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <h2 className="headline text-lg font-semibold text-[var(--text-primary)]">
            კალენდარული გეგმა
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-medium tabular-nums text-[var(--text-secondary)]">
            {totalDays} დღე
          </span>
          <button
            type="button"
            onClick={handleSaveToDashboard}
            disabled={savedToDashboard}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/25 ${
              savedToDashboard
                ? "border-[var(--border)] text-[var(--text-secondary)] dark:border-white/10"
                : "border-[var(--accent-primary)]/40 text-[var(--accent-primary)] hover:bg-pink-50 dark:text-pink-300 dark:hover:bg-pink-400/10"
            }`}
          >
            {savedToDashboard ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                დამატებულია დეშბორდზე
              </>
            ) : (
              <>
                <CalendarPlus className="h-3.5 w-3.5" strokeWidth={2} />
                გადატანა კალენდარში
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between text-xs font-medium tabular-nums text-[var(--text-secondary)]">
          <span>
            {doneCount}/{compactPlan.length} დღე შესრულებული
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)] dark:bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {compactPlan.map((day, idx) => {
          const key = `${day.date}-${day.day_name}`;
          const done = Boolean(doneDays[key]);
          const level = FOCUS_LEVEL_CONFIG[day.focus_level];
          const LevelIcon = level.icon;
          return (
            <div
              key={key}
              style={{ animationDelay: `${idx * 40}ms` }}
              className={`calendar-day-in flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 transition-opacity dark:border-white/10 ${
                done ? "opacity-60" : ""
              }`}
            >
              <span
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] dark:bg-white/[0.05]"
                aria-hidden
              >
                <LevelIcon className="h-4 w-4" strokeWidth={2} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)] dark:bg-white/[0.06]">
                    დღე {idx + 1}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">{day.day_name}</span>
                  <span className="text-xs text-[var(--text-muted)]" aria-hidden>•</span>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {level.label}
                  </span>
                </div>
                <p
                  className={`mt-1 truncate text-sm font-medium text-[var(--text-primary)] ${
                    done ? "line-through decoration-[var(--text-muted)]" : ""
                  }`}
                >
                  {day.topics.join(", ")}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  <Clock className="h-3 w-3" strokeWidth={2} />
                  {day.hours} საათი
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDoneDays((prev) => ({
                    ...prev,
                    [key]: !done,
                  }));
                  if (!done) recordDailyActivity();
                }}
                aria-label={done ? "მონიშნე დაუსრულებლად" : "მონიშნე დასრულებულად"}
                aria-pressed={done}
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/25 ${
                  done
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                    : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] dark:border-white/15 dark:hover:text-pink-300"
                }`}
              >
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          );
        })}
      </div>

      {plan.length > compactPlan.length && (
        <p className="mt-3 text-xs text-[var(--text-secondary)]">
          ნაჩვენებია პირველი {compactPlan.length} დღე. სრულ გრაფიკს შეგიძლია ეტაპობრივად მიჰყვე.
        </p>
      )}

      <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">რჩევა: {advice}</p>

      <details className="mt-4 rounded-xl border border-[var(--border)] p-3 dark:border-white/10">
        <summary className="cursor-pointer rounded text-sm font-medium text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/25">
          სრული დღიური ბარათები
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {plan.map((day) => (
            <DayCard key={`${day.date}-${day.day_name}`} day={day} />
          ))}
        </div>
      </details>
    </section>
  );
}
