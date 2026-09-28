"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Flame, Target, TrendingUp, type LucideIcon } from "lucide-react";
import { useStreak } from "@/hooks/useStreak";
import { DASHBOARD_CARD_TONES, type DashboardCardTone } from "@/components/dashboard/DashboardCard";
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
      ? "დაიწყე დღეს — გახსენი რომელიმე ხელსაწყო"
      : `პირადი რეკორდი: ${streak.best}`;

  const quizValue = metrics?.quizAccuracy != null ? `${metrics.quizAccuracy}%` : "—";
  const quizSub = !metrics
    ? ""
    : metrics.quizAccuracy === null
      ? "გაიარე პირველი ქვიზი"
      : metrics.quizAccuracyDelta === null || metrics.quizAccuracyDelta === 0
        ? "საშუალო სიზუსტე"
        : `${metrics.quizAccuracyDelta > 0 ? "+" : ""}${metrics.quizAccuracyDelta}% ამ თვეში`;

  const sessionsSub = !metrics
    ? ""
    : metrics.sessionsThisWeek === 0
      ? "ჯერ არ დაგიწყია"
      : metrics.sessionsDelta === 0
        ? "იგივე, რაც გასულ კვირას"
        : `${metrics.sessionsDelta > 0 ? "+" : ""}${metrics.sessionsDelta} გასულ კვირასთან`;

  return (
    <section aria-label="მთავარი მაჩვენებლები" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        icon={Flame}
        tone="amber"
        label="სტრიკი"
        value={streak.ready ? `${streak.current} დღე` : "—"}
        sub={streakSub}
      />
      <StatCard
        icon={Target}
        tone="violet"
        label="Quiz სიზუსტე"
        value={quizValue}
        sub={quizSub}
        footer={
          weakest ? (
            <Link
              href={statsHref}
              className="mt-1 block text-xs font-medium leading-normal text-[var(--accent-primary)] hover:underline"
            >
              ყველაზე სუსტი საგანი: {weakest.name} →
            </Link>
          ) : null
        }
      />
      <StatCard
        icon={TrendingUp}
        tone="emerald"
        label="ამ კვირის სესიები"
        value={metrics ? String(metrics.sessionsThisWeek) : "—"}
        sub={sessionsSub}
      />
    </section>
  );
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
  footer,
}: {
  icon: LucideIcon;
  tone: DashboardCardTone;
  label: string;
  value: string;
  sub: string;
  footer?: React.ReactNode;
}) {
  return (
    <article className="flex min-h-[120px] flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${DASHBOARD_CARD_TONES[tone]}`}
          aria-hidden
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <h3 className="text-sm text-[var(--text-secondary)]">{label}</h3>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums leading-none text-[var(--text-primary)]">
        {value}
      </p>
      {sub && <p className="mt-2 text-xs leading-normal text-[var(--text-secondary)]">{sub}</p>}
      {footer}
    </article>
  );
}
