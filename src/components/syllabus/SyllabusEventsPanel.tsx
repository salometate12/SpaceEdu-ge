"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  CALENDAR_UPDATED_EVENT,
  getDashboardCalendarEvents,
  type DashboardCalendarEvent,
} from "@/lib/syllabus-calendar";

const TYPE_META: Record<DashboardCalendarEvent["type"], { label: string; badge: string }> = {
  midterm: {
    label: "შუალედური",
    badge:
      "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300",
  },
  quiz: {
    label: "ქვიზი",
    badge:
      "border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300",
  },
  deadline: {
    label: "დედლაინი",
    badge:
      "border-pink-200 bg-pink-50 text-pink-600 dark:border-pink-400/20 dark:bg-pink-400/10 dark:text-pink-300",
  },
};

export function SyllabusEventsPanel() {
  const [events, setEvents] = useState<DashboardCalendarEvent[]>([]);

  useEffect(() => {
    const sync = () => setEvents(getDashboardCalendarEvents());
    sync();
    window.addEventListener(CALENDAR_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CALENDAR_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (events.length === 0) return null;

  return (
    <div className="dashboard-tool-card mb-6 rounded-[28px] p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl subject-icon-wrap">
          <CalendarDays className="h-4 w-4 text-rose-600 dark:text-rose-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
          სილაბუსიდან დამატებული თარიღები
        </h3>
      </div>
      <div className="space-y-2">
        {events.map((event) => {
          const meta = TYPE_META[event.type];
          return (
            <div key={event.id} className="dashboard-glass-card rounded-2xl px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${meta.badge}`}
                >
                  {meta.label}
                </span>
                <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{event.title}</p>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{event.date}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
