"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  CALENDAR_UPDATED_EVENT,
  getDashboardCalendarEvents,
  type DashboardCalendarEvent,
} from "@/lib/syllabus-calendar";

const TYPE_LABELS: Record<DashboardCalendarEvent["type"], string> = {
  midterm: "შუალედური",
  quiz: "ქვიზი",
  deadline: "დედლაინი",
};

const TYPE_BADGE: Record<DashboardCalendarEvent["type"], string> = {
  midterm:
    "rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400",
  quiz: "rounded border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400",
  deadline:
    "rounded border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400",
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
    <div className="mb-6 rounded-2xl border border-white/[0.06] bg-[#121214]/40 p-5 backdrop-blur-md">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
        <h3 className="text-sm font-semibold text-zinc-100">
          სილაბუსიდან დამატებული თარიღები
        </h3>
      </div>
      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-xl border border-white/[0.08] bg-[#17181b]/50 px-3 py-2.5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className={TYPE_BADGE[event.type]}>[ {TYPE_LABELS[event.type]} ]</span>
              <p className="text-sm font-medium text-zinc-100">{event.title}</p>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">{event.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
