"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Flame, Hourglass } from "lucide-react";
import { getCurrentStreak, STREAK_UPDATED_EVENT } from "@/lib/daily-streak";
import { EXAM_COUNTDOWN_UPDATED_EVENT, getExamCountdownDays } from "@/lib/exam-countdown";
import { STUDY_PLAN_CALENDAR_UPDATED_EVENT } from "@/lib/study-plan-calendar";
import { readTodayPlan, studyPlanHref, type TodayPlan } from "@/lib/today-plan";
import type { DashboardWorkspace } from "./DashboardBannerStats";
import "./dashboard-top.css";

interface DashboardGreetingBannerProps {
  workspace: DashboardWorkspace;
  title: string;
}

const SPACE_LABEL: Record<DashboardWorkspace, string> = {
  student: "სტუდენტის სივრცე",
  abiturient: "აბიტურიენტის სივრცე",
};

const COUNTDOWN_LABEL: Record<DashboardWorkspace, string> = {
  student: "სესიამდე",
  abiturient: "გამოცდამდე",
};

/**
 * The dashboard's greeting: the space, „გამარჯობა, …!“, today's plan with
 * a button to start it, and the streak and countdown tiles.
 *
 * The plan, the streak and the countdown come from this device's storage
 * and today's date, so they're read after mounting — the server render
 * has none of them.
 */
export function DashboardGreetingBanner({ workspace, title }: DashboardGreetingBannerProps) {
  // undefined: not read yet; null: nothing planned today.
  const [plan, setPlan] = useState<TodayPlan | null | undefined>(undefined);
  const [streak, setStreak] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => {
      setPlan(readTodayPlan(workspace));
      setStreak(getCurrentStreak());
      setCountdown(getExamCountdownDays());
    };
    sync();
    const events = [STREAK_UPDATED_EVENT, EXAM_COUNTDOWN_UPDATED_EVENT, STUDY_PLAN_CALENDAR_UPDATED_EVENT, "storage"];
    for (const name of events) window.addEventListener(name, sync);
    return () => {
      for (const name of events) window.removeEventListener(name, sync);
    };
  }, [workspace]);

  return (
    <section className="dash-top flex flex-wrap items-center justify-between gap-6 rounded-[24px] border border-[var(--dt-card-border)] bg-[var(--dt-card)] px-[22px] py-[22px] sm:px-7 sm:py-[26px] max-[639px]:mx-4 max-[639px]:mt-4">
      <div className="min-w-0 flex-[1_1_380px]">
        <p className="text-[13px] font-semibold text-[var(--dt-muted)]">{SPACE_LABEL[workspace]}</p>
        <h1 className="mt-1 text-[24px] font-bold leading-tight tracking-tight text-[var(--dt-title)] sm:text-[28px]">{title}</h1>

        <div className="mt-4 flex items-center gap-3.5 rounded-[16px] max-[479px]:flex-wrap max-[479px]:gap-y-3 border border-[var(--dt-strip-border)] bg-[var(--dt-strip)] py-3 pl-3.5 pr-3">
          <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--dt-pink-bg)] text-[var(--dt-pink)]">
            <CalendarDays className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1 max-[479px]:basis-[calc(100%-54px)]">
            {plan === undefined ? (
              <span className="block h-[38px]" aria-hidden />
            ) : plan ? (
              <>
                <p className="text-[12.5px] font-semibold text-[var(--dt-muted)]">დღეს გეგმაში</p>
                <p className="truncate text-[15px] font-semibold text-[var(--dt-title)]">{plan.line}</p>
              </>
            ) : (
              <p className="text-[15px] font-semibold text-[var(--dt-text)]">დღეს გეგმა არ გაქვს</p>
            )}
          </div>
          {plan === undefined ? null : plan ? (
            <Link
              href={plan.href}
              className="dt-focus inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full max-[479px]:w-full bg-[var(--dt-primary)] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#cf1769]"
            >
              დაწყება
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </Link>
          ) : (
            <Link
              href={studyPlanHref(workspace)}
              className="dt-focus inline-flex h-10 shrink-0 items-center justify-center rounded-full max-[479px]:w-full border border-[var(--dt-secondary-border)] bg-[var(--dt-card)] px-4 text-[14px] font-semibold text-[var(--dt-title)] transition-colors hover:border-[var(--dt-muted)]"
            >
              გეგმის შექმნა
            </Link>
          )}
        </div>
      </div>

      <div className="flex gap-2.5 max-[639px]:w-full">
        <GreetingTile tone="yellow" icon={<Flame className="h-5 w-5" strokeWidth={1.9} />} value={streak} label="სტრიქი" />
        <GreetingTile tone="blue" icon={<Hourglass className="h-5 w-5" strokeWidth={1.9} />} value={countdown} label={COUNTDOWN_LABEL[workspace]} />
      </div>
    </section>
  );
}

function GreetingTile({
  tone,
  icon,
  value,
  label,
}: {
  tone: "yellow" | "blue";
  icon: React.ReactNode;
  value: number | null;
  label: string;
}) {
  return (
    <div
      className={`flex w-[132px] flex-col gap-1.5 rounded-[18px] p-4 max-[639px]:w-auto max-[639px]:flex-1 ${
        tone === "yellow" ? "bg-[var(--dt-yellow-bg)]" : "bg-[var(--dt-blue-bg)]"
      }`}
    >
      <span aria-hidden className={tone === "yellow" ? "text-[var(--dt-yellow)]" : "text-[var(--dt-blue)]"}>
        {icon}
      </span>
      <p className="leading-none text-[var(--dt-title)]">
        <span className="text-[26px] font-bold tabular-nums">{value ?? "—"}</span>
        {value !== null ? <span className="ml-1 text-[14px] font-semibold">დღე</span> : null}
      </p>
      <p className="text-[12.5px] text-[var(--dt-text)]">{label}</p>
    </div>
  );
}
