"use client";

import { Check } from "lucide-react";
import { useStreak } from "@/hooks/useStreak";
import { buildWeekStreak, type StreakDay } from "@/lib/streak";

const FULL_DAY_NAMES = [
  "ორშაბათი",
  "სამშაბათი",
  "ოთხშაბათი",
  "ხუთშაბათი",
  "პარასკევი",
  "შაბათი",
  "კვირა",
];

type Status = StreakDay["status"];

const STATUS_TEXT: Record<Status, string> = {
  done: "შესრულებულია",
  today: "დღეს, ჯერ არ შესრულებულა",
  missed: "გამოტოვებული",
  upcoming: "ჯერ არ დამდგარა",
};

const CIRCLE: Record<Status, string> = {
  done: "bg-[#ec4899] text-white",
  today: "border-2 border-[var(--ps-strong-ring)] bg-[var(--ps-card)]",
  missed: "bg-[var(--ps-soft)]",
  upcoming: "border-[1.5px] border-dashed border-[#d6d3d1] bg-[var(--ps-card)] dark:border-[#3f3f46]",
};

/**
 * This week as seven circles — done, today, missed, still to come — in one
 * card. Shared by both profile overviews.
 *
 * The days come from `buildWeekStreak`, unchanged. It marks the `n` days
 * before today as done and today as "today"; so it is given the streak
 * *without* today, and today is drawn as done once today's activity is in.
 */
export function WeekStreakStrip() {
  const { ready, current, activeToday } = useStreak();
  const week = buildWeekStreak(activeToday ? Math.max(current - 1, 0) : current).map(
    (day): StreakDay =>
      day.status === "today" && activeToday ? { ...day, status: "done" } : day,
  );
  const activeDays = ready ? week.filter((day) => day.status === "done").length : 0;
  // Monday-first, as in buildWeekStreak. Only after hydration: the server's
  // clock (and time zone) may disagree with the reader's.
  const todayIdx = ready ? (new Date().getDay() + 6) % 7 : -1;

  return (
    <section aria-label="ეს კვირა" className="ps-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold text-[var(--ps-title)]">ეს კვირა</h2>
        <span className="text-[13.5px] text-[var(--ps-muted)]">{ready ? `${activeDays} / 7 აქტიური დღე` : ""}</span>
      </div>

      <ol className="mt-4 grid grid-cols-7 gap-1">
        {week.map((day, index) => {
          const status: Status = ready ? day.status : "upcoming";
          const isToday = index === todayIdx;
          const label = `${FULL_DAY_NAMES[index]}: ${STATUS_TEXT[status]}`;
          return (
            <li key={day.fullLabel} className="flex flex-col items-center gap-2">
              <span
                role="img"
                aria-label={label}
                title={label}
                className={`flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10 ${CIRCLE[status]}`}
              >
                {status === "done" && <Check className="h-4 w-4" strokeWidth={3} aria-hidden />}
              </span>
              <span
                className={`text-[12.5px] ${isToday ? "font-semibold text-[#e11d74] dark:text-[#f472b6]" : "text-[var(--ps-muted)]"}`}
                aria-hidden
              >
                {isToday ? "დღეს" : day.fullLabel}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
