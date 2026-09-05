"use client";

import { useEffect, useState } from "react";
import { CalendarClock, GraduationCap, Sparkles, TrendingUp } from "lucide-react";
import { getDaysUntilExam } from "@/lib/profile";
import {
  computeDashboardMetrics,
  DASHBOARD_METRICS_UPDATED_EVENT,
  type DashboardMetrics,
} from "@/lib/dashboard-metrics";
import { STREAK_UPDATED_EVENT } from "@/lib/daily-streak";

interface MetricCardsProps {
  /** From the user's profile — the one date we can't derive from activity. */
  examDate: string;
}

export function MetricCards({ examDate }: MetricCardsProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    const refresh = () => setMetrics(computeDashboardMetrics());
    refresh();
    window.addEventListener(DASHBOARD_METRICS_UPDATED_EVENT, refresh);
    window.addEventListener(STREAK_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(DASHBOARD_METRICS_UPDATED_EVENT, refresh);
      window.removeEventListener(STREAK_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const daysUntilExam = examDate ? getDaysUntilExam(examDate) : 0;
  const examPassed = !examDate || daysUntilExam === 0;

  const sessionsSub = !metrics
    ? ""
    : metrics.sessionsThisWeek === 0
      ? "ჯერ არ დაგიწყია"
      : metrics.sessionsDelta > 0
        ? `+${metrics.sessionsDelta} გასულ კვირასთან`
        : metrics.sessionsDelta < 0
          ? `${metrics.sessionsDelta} გასულ კვირასთან`
          : "იგივე, რაც გასულ კვირას";

  const quizValue = !metrics
    ? "—"
    : metrics.quizAccuracy === null
      ? "—"
      : `${metrics.quizAccuracy}%`;
  const quizSub = !metrics
    ? ""
    : metrics.quizAccuracy === null
      ? "გაიარე პირველი ქვიზი"
      : metrics.quizAccuracyDelta === null
        ? "საშუალო სიზუსტე"
        : metrics.quizAccuracyDelta > 0
          ? `+${metrics.quizAccuracyDelta}% ამ თვეში`
          : metrics.quizAccuracyDelta < 0
            ? `${metrics.quizAccuracyDelta}% ამ თვეში`
            : "უცვლელი ამ თვეში";

  const cards = [
    {
      label: "ამ კვირის სესიები",
      value: metrics ? String(metrics.sessionsThisWeek) : "—",
      sub: sessionsSub,
      bg: "#d1fae5",
      text: "#065f46",
      icon: TrendingUp,
    },
    {
      label: "გამოცდამდე",
      value: examPassed ? null : String(daysUntilExam),
      sub: examPassed ? "თარიღი არაა მითითებული" : "დღე დარჩა",
      bg: "#fef3c7",
      text: "#92400e",
      icon: examPassed ? GraduationCap : CalendarClock,
    },
    {
      label: "Quiz სიზუსტე",
      value: quizValue,
      sub: quizSub,
      bg: "#efe9fe",
      text: "#5b21b6",
      icon: Sparkles,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {cards.map((metric) => (
        <article
          key={metric.label}
          className="relative overflow-hidden rounded-[28px] p-5 transition-transform hover:-translate-y-1"
          style={{ background: metric.bg }}
        >
          <div className="relative flex items-center justify-between">
            <p className="text-xs font-bold" style={{ color: metric.text, opacity: 0.8 }}>
              {metric.label}
            </p>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: "rgb(255 255 255 / 0.55)" }}
            >
              <metric.icon className="h-4 w-4 stroke-[2]" style={{ color: metric.text }} />
            </span>
          </div>
          <p className="mono relative mt-3 text-4xl font-black" style={{ color: metric.text }}>
            {metric.value ?? <metric.icon className="h-9 w-9" strokeWidth={2.25} />}
          </p>
          <p className="relative mt-1 text-xs font-bold" style={{ color: metric.text, opacity: 0.75 }}>
            {metric.sub}
          </p>
        </article>
      ))}
    </section>
  );
}
