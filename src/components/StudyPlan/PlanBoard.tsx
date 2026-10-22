"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { dayChip, FOCUS_LABEL, type SavedStudyPlan, type StudyPlanDay } from "@/lib/study-plan-board";
import { SP_CARD, SP_FOCUS } from "./planner-styles";

const FOCUS_TONE: Record<StudyPlanDay["focus_level"], { dot: string; text: string }> = {
  high: { dot: "var(--sp-high)", text: "var(--sp-high-text)" },
  medium: { dot: "var(--sp-medium)", text: "var(--sp-medium-text)" },
  review: { dot: "var(--sp-review)", text: "var(--sp-review-text)" },
};

const STEPS = ["ვითვლი დარჩენილ დღეებს", "ვანაწილებ თემებს", "ვამატებ რჩევებს"];
/** The API doesn't report stages: the steps move on with time, the last waits for the plan. */
const STEP_AT_MS = [2500, 7000];

function Generating() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = STEP_AT_MS.map((ms, index) => window.setTimeout(() => setStep(index + 1), ms));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);
  return (
    <div aria-busy>
      <p className="text-[18px] font-bold text-[var(--sp-strong)]">ვადგენ შენს გეგმას</p>
      <ol className="mt-4 space-y-3" aria-live="polite">
        {STEPS.map((label, index) => {
          const state = index < step ? "done" : index === step ? "current" : "next";
          return (
            <li key={label} aria-current={state === "current" ? "step" : undefined} className={`flex items-center gap-3 ${state === "next" ? "opacity-50" : ""}`}>
              <span
                aria-hidden
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  state === "done"
                    ? "bg-[var(--sp-ok)] text-white"
                    : state === "current"
                      ? "border-2 border-[var(--sp-strong)]"
                      : "border-2 border-[var(--sp-line)]"
                }`}
              >
                {state === "done" ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : state === "current" ? (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--sp-accent)] motion-reduce:animate-none" />
                ) : null}
              </span>
              <span className={`text-[15px] ${state === "current" ? "font-semibold text-[var(--sp-strong)]" : "text-[var(--sp-text)]"}`}>
                {label}
                {state === "done" ? <span className="sr-only"> — მზადაა</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-6 divide-y divide-[var(--sp-card-border)] border-t border-[var(--sp-card-border)]" aria-hidden>
        {[1, 0.75, 0.5, 0.3].map((opacity) => (
          <div key={opacity} className="flex items-center gap-3 py-4" style={{ opacity }}>
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--sp-soft)]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 animate-pulse rounded bg-[var(--sp-soft)] motion-reduce:animate-none" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--sp-soft)] motion-reduce:animate-none" />
            </div>
            <span className="h-9 w-9 rounded-full bg-[var(--sp-soft)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The plan: empty, being made, or the days — a strip of dates (today dark,
 * done ticked) over a list where each day opens to its tasks; today's is
 * open. Done days and „კალენდარში“ are handled by the page.
 */
export function PlanBoard({
  saved,
  loading,
  today,
  onToggleDone,
  onToCalendar,
  onCalendar,
}: {
  saved: SavedStudyPlan | null;
  loading: boolean;
  today: string;
  onToggleDone: (date: string) => void;
  onToCalendar: () => void;
  /** Already copied to the dashboard calendar. */
  onCalendar: boolean;
}) {
  // Days opened or closed by hand; today's starts open.
  const [toggled, setToggled] = useState<Set<string>>(() => new Set());
  const isOpen = (date: string) => (date === today) !== toggled.has(date);
  const rows = useRef(new Map<string, HTMLLIElement>());

  if (loading) {
    return (
      <section aria-label="გეგმა" className={`${SP_CARD} p-5 sm:p-6`}>
        <Generating />
      </section>
    );
  }

  if (!saved) {
    return (
      <section aria-label="გეგმა" className={`${SP_CARD} p-5 sm:p-6`}>
        <p className="text-[15px] leading-relaxed text-[var(--sp-muted)]">
          შეავსე ზემოთ საგანი და თარიღი — აქ დღეებად დალაგებული გეგმა გამოჩნდება.
        </p>
      </section>
    );
  }

  const days = saved.plan;
  const doneCount = days.filter((day) => saved.done.includes(day.date)).length;

  const jumpTo = (date: string) => {
    if (!isOpen(date)) setToggled((current) => new Set(current).add(date));
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rows.current.get(date)?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
  };

  return (
    <section aria-label="გეგმა" className={`${SP_CARD} min-w-0 p-5 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-[var(--sp-strong)]">შენი {days.length} დღე</h2>
          <p className="mt-0.5 text-[13.5px] tabular-nums text-[var(--sp-muted)]">
            {doneCount} / {days.length} შესრულებული
          </p>
        </div>
        <button
          type="button"
          onClick={onToCalendar}
          disabled={onCalendar}
          className={`inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--sp-ink)] px-4 text-[13px] font-semibold text-[var(--sp-ink-text)] transition-opacity hover:opacity-90 disabled:opacity-60 ${SP_FOCUS}`}
        >
          {onCalendar ? <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden /> : <CalendarDays className="h-4 w-4" aria-hidden />}
          {onCalendar ? "კალენდარშია" : "კალენდარში"}
        </button>
      </div>

      {saved.general ? (
        <Alert tone="info" className="mt-4">
          თემები არ მითითებია — ზოგადი გეგმა შევადგინე, თემების დამატებით უფრო ზუსტი იქნება.
        </Alert>
      ) : null}

      {/* The days at a glance; scrolls sideways past a week. */}
      <div className="-mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]" aria-label="დღეები">
        {days.map((day) => {
          const chip = dayChip(day.date);
          const isToday = day.date === today;
          const done = saved.done.includes(day.date);
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => jumpTo(day.date)}
              aria-label={`${day.day_name}, ${chip.day}${done ? " — შესრულებული" : ""}`}
              className={`relative flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-[12px] border text-center transition-colors ${SP_FOCUS} ${
                isToday
                  ? "border-[var(--sp-ink)] bg-[var(--sp-ink)] text-[var(--sp-ink-text)]"
                  : "border-[var(--sp-line)] bg-[var(--sp-card)] text-[var(--sp-strong)] hover:border-[var(--sp-muted)]"
              }`}
            >
              <span className={`text-[11px] font-medium ${isToday ? "" : "text-[var(--sp-muted)]"}`}>{chip.weekday}</span>
              <span className="text-[16px] font-bold tabular-nums leading-tight">{chip.day}</span>
              {done ? (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--sp-ok)] text-white" aria-hidden>
                  <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <ol className="mt-3 divide-y divide-[var(--sp-card-border)]">
        {days.map((day, index) => {
          const done = saved.done.includes(day.date);
          const expanded = isOpen(day.date);
          const tone = FOCUS_TONE[day.focus_level];
          return (
            <li
              key={day.date}
              ref={(element) => {
                if (element) rows.current.set(day.date, element);
                else rows.current.delete(day.date);
              }}
              className="scroll-mt-24 py-3.5"
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setToggled((current) => {
                      const next = new Set(current);
                      if (next.has(day.date)) next.delete(day.date);
                      else next.add(day.date);
                      return next;
                    })
                  }
                  aria-expanded={expanded}
                  className={`flex min-w-0 flex-1 items-start gap-3 rounded-[10px] text-left ${SP_FOCUS}`}
                >
                  <span className="mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: tone.dot }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-semibold" style={{ color: tone.text }}>
                      დღე {index + 1} · {day.day_name} · {FOCUS_LABEL[day.focus_level]} · {day.hours} სთ
                    </span>
                    <span
                      className={`mt-0.5 block text-[16px] font-semibold leading-snug ${
                        done ? "text-[var(--sp-muted)]" : "text-[var(--sp-strong)]"
                      }`}
                    >
                      {day.topics.join(", ")}
                    </span>
                  </span>
                  <ChevronDown
                    className={`mt-1 h-4 w-4 shrink-0 text-[var(--sp-muted)] transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleDone(day.date)}
                  aria-pressed={done}
                  aria-label={done ? `დღე ${index + 1}: მონიშნე შეუსრულებლად` : `დღე ${index + 1}: მონიშნე შესრულებულად`}
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${SP_FOCUS} ${
                    done
                      ? "border-[var(--sp-ok)] bg-[var(--sp-ok)] text-white"
                      : "border-[var(--sp-line)] bg-[var(--sp-card)] text-[var(--sp-muted)] hover:border-[var(--sp-ok)] hover:text-[var(--sp-ok)]"
                  }`}
                >
                  <Check className="h-4 w-4" strokeWidth={2.6} />
                </button>
              </div>
              {expanded && day.tasks.length > 0 ? (
                <ul className="ml-[22px] mt-2.5 space-y-1.5 border-l border-[var(--sp-card-border)] pl-3.5 text-[14.5px] leading-relaxed text-[var(--sp-text)]">
                  {day.tasks.map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ol>

      {saved.advice.trim() ? (
        <p className="mt-4 rounded-[14px] bg-[var(--sp-tip-bg)] px-4 py-3 text-[14.5px] leading-relaxed text-[var(--sp-tip-text)]">
          <strong className="font-bold">რჩევა:</strong> {saved.advice}
        </p>
      ) : null}
    </section>
  );
}
