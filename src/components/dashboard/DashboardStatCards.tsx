"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { BriefcaseBusiness, Clock, Layers, ListChecks, type LucideIcon } from "lucide-react";
import type { DashboardMetrics } from "@/lib/dashboard-metrics";
import { researchPlatformHref } from "@/lib/space-back-navigation";
import "./dashboard-top.css";

type Tone = "yellow" | "pink" | "blue" | "green";

interface StatCard {
  key: string;
  label: string;
  value: string;
  sub: string | null;
  /** The sub line as a rise (green, semibold). */
  up?: boolean;
  href: string;
  icon: LucideIcon;
  tone: Tone;
}

/** Each tone's tint, and in the dark the tint a little stronger for hover. */
const TONE: Record<Tone, { vars: CSSProperties; icon: string }> = {
  yellow: { vars: { "--stat-bg": "var(--dt-yellow-bg)", "--stat-bg-hover": "rgba(250,204,21,.16)" } as CSSProperties, icon: "text-[var(--dt-yellow)]" },
  pink: { vars: { "--stat-bg": "var(--dt-pink-bg)", "--stat-bg-hover": "rgba(236,72,153,.18)" } as CSSProperties, icon: "text-[var(--dt-pink)]" },
  blue: { vars: { "--stat-bg": "var(--dt-blue-bg)", "--stat-bg-hover": "rgba(56,189,248,.16)" } as CSSProperties, icon: "text-[var(--dt-blue)]" },
  green: { vars: { "--stat-bg": "var(--dt-green-bg)", "--stat-bg-hover": "rgba(74,222,128,.16)" } as CSSProperties, icon: "text-[var(--dt-green)]" },
};

/** The four cards' texts from the metrics (null before they're read). */
export function statCards(m: DashboardMetrics | null): StatCard[] {
  const sessions: StatCard = {
    key: "sessions",
    label: "ამ კვირის სესიები",
    value: m ? String(m.sessionsThisWeek) : "—",
    sub: m ? (m.sessionsThisWeek === 0 ? "ჯერ არ დაგიწყია" : "ამ კვირაში") : null,
    href: "/profile/stats",
    icon: Clock,
    tone: "yellow",
  };

  const delta = m?.quizAccuracyDelta ?? null;
  const quiz: StatCard = {
    key: "quiz",
    label: "ქვიზის სიზუსტე",
    value: m?.quizAccuracy != null ? `${m.quizAccuracy}%` : "—",
    sub: !m ? null : m.quizAccuracy === null ? "გაიარე პირველი ქვიზი" : delta ? `${delta > 0 ? "+" : ""}${delta}% ამ თვეში` : null,
    up: Boolean(delta && delta > 0),
    href: "/quiz",
    icon: ListChecks,
    tone: "pink",
  };

  const research: StatCard = {
    key: "research",
    label: "კვლევები",
    value: m ? String(m.researchThisSemester) : "—",
    sub: m ? "ამ სემესტრში" : null,
    href: researchPlatformHref("student"),
    icon: Layers,
    tone: "blue",
  };

  const days = m?.cvUpdatedDaysAgo ?? null;
  const cv: StatCard = {
    key: "cv",
    label: "CV",
    value: days === null ? "—" : days === 0 ? "დღეს" : days === 1 ? "გუშინ" : `${days} დღის წინ`,
    sub: !m ? null : days === null ? "ჯერ არ შეგიქმნია" : "ბოლო განახლება",
    href: "/cv",
    icon: BriefcaseBusiness,
    tone: "green",
  };

  return [sessions, quiz, research, cv];
}

/** The four stat cards under the greeting: one tint each, a link each. */
export function DashboardStatCards({ metrics }: { metrics: DashboardMetrics | null }) {
  return (
    <div className="dash-top grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
      {statCards(metrics).map((card) => {
        const Icon = card.icon;
        const look = TONE[card.tone];
        return (
          <Link
            key={card.key}
            href={card.href}
            aria-label={`${card.label}: ${card.value}`}
            style={look.vars}
            className="dash-stat flex min-w-0 flex-col gap-3 rounded-[22px] p-[18px]"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="text-[13px] font-semibold leading-snug text-[var(--dt-text)]">{card.label}</span>
              <span aria-hidden className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] bg-[var(--dt-icon-plate)] ${look.icon}`}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </span>
            </span>
            <span className="block text-[30px] font-bold leading-none tracking-tight text-[var(--dt-title)]">{card.value}</span>
            {card.sub ? (
              <span className={`block text-[13px] ${card.up ? "font-semibold text-[var(--dt-up)]" : "text-[var(--dt-muted)]"}`}>{card.sub}</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
