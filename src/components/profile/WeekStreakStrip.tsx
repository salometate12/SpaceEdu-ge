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
  today: "დღეს — ჯერ არ შესრულებულა",
  missed: "გამოტოვებული",
  upcoming: "ჯერ არ დამდგარა",
};

const CIRCLE: Record<Status, string> = {
  done: "bg-[var(--strip-accent)] text-white",
  today: "border-2 border-[var(--strip-accent)] bg-[var(--bg-card)]",
  missed: "bg-[var(--bg-secondary)]",
  upcoming: "border border-dashed border-[var(--border-hover)] bg-[var(--bg-card)]",
};

interface WeekStreakStripProps {
  /** Picks the accent: the student pink or the abiturient green. */
  space: "student" | "abiturient";
}

/**
 * This week as seven circles — done, today, missed, still to come — in one
 * thin card. Shared by both profile overviews.
 *
 * The days come from `buildWeekStreak`, unchanged. It marks the `n` days
 * before today as done and today as "today"; so it is given the streak
 * *without* today, and today is drawn as done once today's activity is in.
 */
export function WeekStreakStrip({ space }: WeekStreakStripProps) {
  const { ready, current, activeToday } = useStreak();
  const week = buildWeekStreak(activeToday ? Math.max(current - 1, 0) : current).map(
    (day): StreakDay =>
      day.status === "today" && activeToday ? { ...day, status: "done" } : day,
  );
  const activeDays = ready ? week.filter((day) => day.status === "done").length : 0;
  const accent = space === "abiturient" ? "var(--accent-green)" : "var(--accent-primary)";
  // Monday-first, as in buildWeekStreak. Only after hydration: the server's
  // clock (and time zone) may disagree with the reader's.
  const todayIdx = ready ? (new Date().getDay() + 6) % 7 : -1;

  return (
    <section
      aria-label="ეს კვირა"
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:px-5"
      style={{ ["--strip-accent" as string]: accent }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="headline text-sm font-semibold text-[var(--text-primary)]">ეს კვირა</h2>
        <span className="text-xs tabular-nums text-[var(--text-secondary)]">
          {ready ? `${activeDays}/7 აქტიური დღე` : "—"}
        </span>
      </div>

      <ol className="mt-3 grid grid-cols-7">
        {week.map((day, index) => {
          const status: Status = ready ? day.status : "upcoming";
          const isToday = index === todayIdx;
          const next = week[index + 1];
          const chained = ready && status === "done" && next?.status === "done";
          const label = `${FULL_DAY_NAMES[index]} — ${STATUS_TEXT[status]}`;
          return (
            <li key={day.fullLabel} className="flex flex-col items-center gap-1.5">
              <span
                className={`text-xs ${
                  isToday
                    ? "font-semibold text-[var(--strip-accent)]"
                    : "text-[var(--text-secondary)]"
                }`}
                aria-hidden
              >
                {day.fullLabel}
              </span>
              <span className="relative flex w-full justify-center">
                {/* A thin link to the next done day, so a streak reads as a chain. */}
                {chained && (
                  <span
                    className="absolute left-1/2 top-1/2 h-0.5 w-full -translate-y-1/2 bg-[var(--strip-accent)] opacity-30"
                    aria-hidden
                  />
                )}
                <span
                  role="img"
                  aria-label={label}
                  title={label}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full sm:h-9 sm:w-9 ${CIRCLE[status]}`}
                >
                  {status === "done" && <Check className="h-4 w-4" strokeWidth={3} aria-hidden />}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

