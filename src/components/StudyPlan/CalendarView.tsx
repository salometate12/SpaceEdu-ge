"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, Clock } from "lucide-react";
import { SyllabusEventsPanel } from "@/components/syllabus/SyllabusEventsPanel";
import { DayCard } from "./DayCard";
import { FOCUS_LEVEL_CONFIG } from "./focus-level-config";

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
}

export function CalendarView({ plan, totalDays, advice }: CalendarViewProps) {
  const [doneDays, setDoneDays] = useState<Record<string, boolean>>({});

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
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-purple-500/15 dark:text-purple-300">
            <CalendarDays className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
          <h2 className="headline text-xl font-semibold text-slate-900 dark:text-zinc-100">
            კალენდარული გეგმა
          </h2>
        </div>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-zinc-400">
          {totalDays} დღე
        </span>
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-xl border border-violet-200/60 bg-violet-50/50 px-3 py-2.5 dark:border-purple-500/20 dark:bg-purple-500/[0.06]">
        <span className="text-lg" aria-hidden>
          {progressEmoji}
        </span>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs font-medium text-violet-700 dark:text-purple-200">
            <span>
              {doneCount}/{compactPlan.length} დღე შესრულებული
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
              className={`calendar-day-in flex items-start gap-3 rounded-xl border border-l-4 ${level.accent} border-slate-200/80 bg-gradient-to-r from-white to-violet-50/30 p-3 transition-opacity dark:border-white/[0.08] dark:bg-none dark:bg-[#17181b]/80 ${
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
                onClick={() =>
                  setDoneDays((prev) => ({
                    ...prev,
                    [key]: !done,
                  }))
                }
                aria-label={done ? "მონიშნე დაუსრულებლად" : "მონიშნე დასრულებულად"}
                aria-pressed={done}
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all active:scale-90 ${
                  done
                    ? "border-emerald-400/60 bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
                    : "border-slate-200 bg-white text-slate-400 hover:border-violet-300 hover:text-violet-600 dark:border-white/[0.12] dark:bg-white/[0.03] dark:text-zinc-500 dark:hover:border-purple-400/40 dark:hover:text-purple-300"
                }`}
              >
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          );
        })}
      </div>

      {plan.length > compactPlan.length && (
        <p className="mt-3 text-xs text-zinc-500">
          ნაჩვენებია პირველი {compactPlan.length} დღე. სრულ გრაფიკს შეგიძლია ეტაპობრივად მიჰყვე.
        </p>
      )}

      <p className="mt-4 text-sm text-zinc-400">რჩევა: {advice}</p>

      <details className="mt-4 rounded-xl border border-white/[0.08] bg-[#151619]/35 p-3">
        <summary className="cursor-pointer text-sm text-zinc-300 transition hover:text-white">
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
