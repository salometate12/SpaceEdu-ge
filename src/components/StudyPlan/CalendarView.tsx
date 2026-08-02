"use client";

import { useMemo, useState } from "react";
import { SyllabusEventsPanel } from "@/components/syllabus/SyllabusEventsPanel";
import { DayCard } from "./DayCard";

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

  return (
    <section className="h-full">
      <SyllabusEventsPanel />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="headline text-xl font-semibold text-slate-900 dark:text-zinc-100">
          კალენდარული გეგმა
        </h2>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-zinc-400">
          {totalDays} დღე
        </span>
      </div>
      <div className="space-y-3">
        {compactPlan.map((day, idx) => {
          const key = `${day.date}-${day.day_name}`;
          const done = Boolean(doneDays[key]);
          return (
            <div
              key={key}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-gradient-to-r from-white to-violet-50/30 p-3 dark:border-white/[0.08] dark:bg-[#17181b]/50"
            >
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-zinc-500">
                  დღე {idx + 1} • {day.day_name}
                </p>
                <p className="truncate text-sm font-medium text-slate-900 dark:text-zinc-100">
                  {day.topics.join(", ")}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">{day.hours} საათი</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDoneDays((prev) => ({
                    ...prev,
                    [key]: !done,
                  }))
                }
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm transition ${
                  done
                    ? "border-emerald-400/50 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-700 dark:border-white/[0.12] dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:border-purple-400/35 dark:hover:text-zinc-100"
                }`}
                aria-label="toggle complete"
              >
                ✓
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
