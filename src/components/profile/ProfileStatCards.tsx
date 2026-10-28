"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStreak } from "@/hooks/useStreak";
import {
  computeDashboardMetrics,
  DASHBOARD_METRICS_UPDATED_EVENT,
  type DashboardMetrics,
} from "@/lib/dashboard-metrics";
import { STREAK_UPDATED_EVENT } from "@/lib/daily-streak";
import { computeSubjectProgress } from "@/lib/subject-progress";

interface ProfileStatCardsProps {
  /** The stats page for this space — where "weakest subject" links to. */
  statsHref: string;
}

interface Weakest {
  name: string;
  accuracy: number;
}

/** The subject with the lowest quiz accuracy, once there are two to compare. */
function weakestSubject(): Weakest | null {
  const rated = computeSubjectProgress().subjects.filter(
    (subject): subject is typeof subject & { accuracy: number } => subject.accuracy !== null,
  );
  if (rated.length < 2) return null;
  const weakest = rated.reduce((low, subject) => (subject.accuracy < low.accuracy ? subject : low));
  return { name: weakest.name, accuracy: weakest.accuracy };
}

/**
 * Streak · quiz accuracy · this week's sessions — three equal cards in one
 * row. Colour only on the icon tile. The streak comes from `useStreak`, the
 * same as the sidebar and header, so all three show one number.
 */
export function ProfileStatCards({ statsHref }: ProfileStatCardsProps) {
  const streak = useStreak();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [weakest, setWeakest] = useState<Weakest | null>(null);

  useEffect(() => {
    const refresh = () => {
      setMetrics(computeDashboardMetrics());
      setWeakest(weakestSubject());
    };
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

  const streakSub = !streak.ready
    ? ""
    : streak.current === 0
      ? "დაიწყე დღეს, გახსენი რომელიმე ხელსაწყო"
      : `რეკორდი: ${streak.best} დღე`;

  const quizValue = metrics?.quizAccuracy != null ? `${metrics.quizAccuracy}%` : "—";
  const quizSub = !metrics
    ? ""
    : metrics.quizAccuracy === null
      ? "გაიარე პირველი ქვიზი"
      : metrics.quizAccuracyDelta === null || metrics.quizAccuracyDelta === 0
        ? "იგივე, რაც გასულ თვეს"
        : `${metrics.quizAccuracyDelta > 0 ? "+" : ""}${metrics.quizAccuracyDelta}% ამ თვეში`;
  const quizUp = (metrics?.quizAccuracyDelta ?? 0) > 0;

  const sessionsSub = !metrics
    ? ""
    : metrics.sessionsThisWeek === 0
      ? "ჯერ არ დაგიწყია"
      : metrics.sessionsDelta === 0
        ? "იგივე, რაც გასულ კვირას"
        : `${metrics.sessionsDelta > 0 ? "+" : ""}${metrics.sessionsDelta} გასულ კვირასთან`;

  return (
    <section aria-label="მთავარი მაჩვენებლები" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="სტრიქი" value={streak.ready ? `${streak.current} დღე` : "—"} sub={streakSub} />
      <StatCard
        label="ქვიზის სიზუსტე"
        value={quizValue}
        sub={quizSub}
        good={quizUp}
        footer={
          weakest ? (
            <Link
              href={statsHref}
              className="ps-focus mt-2 block rounded-sm text-[13px] font-semibold leading-normal text-[#be185d] hover:underline dark:text-[#f9a8d4]"
            >
              ყველაზე სუსტი: {weakest.name} →
            </Link>
          ) : null
        }
      />
      <StatCard
        label="ამ კვირის სესიები"
        value={metrics ? String(metrics.sessionsThisWeek) : "—"}
        sub={sessionsSub}
        good={(metrics?.sessionsDelta ?? 0) > 0}
      />
    </section>
  );
}

function StatCard({
  label,
  value,
  sub,
  good = false,
  footer,
}: {
  label: string;
  value: string;
  sub: string;
  /** The line under the number is good news: green instead of muted. */
  good?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <article className="ps-card flex min-h-[132px] flex-col p-5">
      <h3 className="text-[13.5px] font-medium text-[var(--ps-muted)]">{label}</h3>
      <p className="mt-2 text-[30px] font-bold leading-none text-[var(--ps-title)]">{value}</p>
      {sub && (
        <p className={`mt-2 text-[13px] leading-normal ${good ? "font-semibold text-[#16a34a] dark:text-[#86efac]" : "text-[var(--ps-muted)]"}`}>
          {sub}
        </p>
      )}
      {footer}
    </article>
  );
}
