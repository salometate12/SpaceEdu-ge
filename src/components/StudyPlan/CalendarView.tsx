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
  const progressEmoji = doneCount === 0 ? "🌱" : progressPct === 100 ? "🏆" : "🔥";

  return (
    <section className="h-full">
      <SyllabusEventsPanel />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="subject-icon-wrap flex h-9 w-9 items-center justify-center rounded-xl text-violet-600 dark:text-violet-400">
            <CalendarDays className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
          <h2 className="headline text-xl font-semibold text-slate-900 dark:text-zinc-100">
            კალენდარული გეგმა
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-zinc-400">
            {totalDays} დღე
          </span>
          <button
            type="button"
            onClick={handleSaveToDashboard}
            disabled={savedToDashboard}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition active:scale-[0.97] ${
              savedToDashboard
                ? "border-emerald-400/50 bg-emerald-50 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-violet-300/60 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/20"
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

      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-violet-200/60 bg-violet-50/50 px-3 py-2.5 dark:border-violet-400/20 dark:bg-violet-500/[0.06]">
        <span className="text-lg" aria-hidden>
          {progressEmoji}
        </span>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs font-medium text-violet-700 dark:text-violet-200">
            <span>
              {doneCount}/{compactPlan.length} დღე შესრულებული
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-violet-100 dark:bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-500 dark:bg-violet-400"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {compactPlan.map((day, idx) => {
          const key = `${day.date}-${day.day_name}`;
          const done = Boolean(doneDays[key]);
          const level = FOCUS_LEVEL_CONFIG[day.focus_level];
          const LevelIcon = level.icon;
          return (
            <div
              key={key}
              style={{ animationDelay: `${idx * 40}ms` }}
              className={`calendar-day-in flex items-start gap-3 rounded-2xl border border-l-4 ${level.accent} border-slate-200/80 bg-white p-3 transition-opacity dark:border-white/[0.08] dark:bg-[#17181b]/80 ${
                done ? "opacity-60" : ""
              }`}
            >
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${level.iconWrap}`}
                aria-hidden
              >
                <LevelIcon className="h-4 w-4" strokeWidth={2} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-white/[0.06] dark:text-zinc-400">
                    დღე {idx + 1}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-zinc-500">{day.day_name}</span>
                  <span className="text-xs text-slate-400 dark:text-zinc-600">•</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                    {level.label}
                  </span>
                </div>
                <p
                  className={`mt-1 truncate text-sm font-medium text-slate-900 dark:text-zinc-100 ${
                    done ? "line-through decoration-slate-400 dark:decoration-zinc-500" : ""
                  }`}
                >
                  {day.topics.join(", ")}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-600 dark:text-zinc-400">
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
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition active:scale-90 ${
                  done
                    ? "border-emerald-400/60 bg-emerald-500 text-white dark:shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
                    : "border-slate-200 bg-white text-slate-400 hover:border-violet-300 hover:text-violet-600 dark:border-white/[0.12] dark:bg-white/[0.03] dark:text-zinc-500 dark:hover:border-violet-400/40 dark:hover:text-violet-300"
                }`}
              >
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          );
        })}
      </div>

      {plan.length > compactPlan.length && (
        <p className="mt-3 text-xs text-slate-500 dark:text-zinc-500">
          ნაჩვენებია პირველი {compactPlan.length} დღე. სრულ გრაფიკს შეგიძლია ეტაპობრივად მიჰყვე.
        </p>
      )}

      <p className="mt-4 text-sm text-slate-600 dark:text-zinc-400">რჩევა: {advice}</p>

      <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/[0.08] dark:bg-[#151619]/35">
        <summary className="cursor-pointer text-sm font-medium text-slate-700 transition hover:text-violet-700 dark:text-zinc-300 dark:hover:text-white">
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
