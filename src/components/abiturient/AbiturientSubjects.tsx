"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { DashboardGlowCard } from "./DashboardGlowCard";
import { getNeonAccent } from "@/lib/abiturient-neon-accents";
import { usePreviewMode } from "@/contexts/PreviewModeContext";
import {
  DashboardMorphGrid,
  DashboardMorphItem,
} from "@/components/dashboard/DashboardMorphGrid";
import {
  getSubjectCardClass,
  isLivePreviewMode,
} from "@/lib/dashboard-preview-layout";
import {
  ABITURIENT_LAST_ACTIVE,
  ABITURIENT_SUBJECTS,
  type AbiturientLastActive,
  type AbiturientSubjectCard,
} from "@/lib/abiturient-subjects";

function neonVars(accent: ReturnType<typeof getNeonAccent>): CSSProperties {
  return {
    "--accent-color": accent.accent,
    "--accent-color-glow": accent.glow,
  } as CSSProperties;
}

function NeonProgressBar({
  percent,
  accentHex,
  glowRgba,
}: {
  percent: number;
  accentHex: string;
  glowRgba: string;
}) {
  const value = Math.min(100, Math.max(0, percent));

  return (
    <div
      className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/[0.1]"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-[var(--accent-color)] to-indigo-500 transition-all duration-700 ease-out"
        style={{
          width: `${value}%`,
          boxShadow: `0 0 10px ${glowRgba}`,
        }}
      />
    </div>
  );
}

function StartButton({ label, accentHex }: { label: string; accentHex: string }) {
  return (
    <span
      className="mt-4 inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors duration-300 group-hover:border-[color:var(--accent-color)]/40 group-hover:bg-[var(--accent-color)] group-hover:text-white dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-zinc-300"
      style={{ ["--accent-color" as string]: accentHex }}
    >
      {label}
    </span>
  );
}

function StatusLabel({ children }: { children: string }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500">
      {children}
    </span>
  );
}

function ActiveLearningCard({
  subject,
  isLive,
}: {
  subject: AbiturientLastActive;
  isLive: boolean;
}) {
  const accent = getNeonAccent(subject.id);
  const Icon = subject.icon;
  const cardClass = isLive
    ? "mb-6 flex min-h-[104px] flex-row items-center gap-4 border-violet-300/60 bg-gradient-to-r from-violet-100/80 via-violet-50/50 to-indigo-50 p-4 sm:p-5 dark:border-purple-500/35 dark:bg-none dark:bg-gradient-to-r dark:from-purple-900/25 dark:via-white/[0.02] dark:to-indigo-900/20"
    : "mb-8 border-violet-300/60 bg-gradient-to-r from-violet-100/80 via-violet-50/50 to-indigo-50 dark:border-purple-500/35 dark:bg-none dark:bg-gradient-to-r dark:from-purple-900/25 dark:via-white/[0.02] dark:to-indigo-900/20 p-6";

  return (
    <DashboardGlowCard
      accent={accent}
      href={subject.href}
      layoutId="abit-active-learning"
      className={cardClass}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="subject-icon-wrap-featured flex h-12 w-12 shrink-0 items-center justify-center">
            <Icon className={`h-6 w-6 ${accent.iconClass}`} strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-purple-300">
              განაგრძე სწავლა
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              {subject.title}
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-gray-400">
              {subject.answered.toLocaleString("ka-GE")} /{" "}
              {subject.total.toLocaleString("ka-GE")} კითხვა · {subject.percent}%
            </p>
            <NeonProgressBar
              percent={subject.percent}
              accentHex={accent.accent}
              glowRgba={accent.glow}
            />
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-violet-600 transition group-hover:text-violet-800 dark:text-purple-200 dark:group-hover:text-white">
          გახსნა
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
        </span>
      </div>
    </DashboardGlowCard>
  );
}

function SubjectGridCard({
  subject,
  isLive,
}: {
  subject: AbiturientSubjectCard;
  isLive: boolean;
}) {
  const accent = getNeonAccent(subject.id);
  const Icon = subject.icon;
  const cardClass = getSubjectCardClass(isLive ? "live" : "mock");

  if (subject.kind === "locked") {
    return (
      <DashboardGlowCard
        accent={accent}
        interactive={false}
        layoutId={`abit-subject-${subject.id}`}
        className={cardClass}
      >
        {isLive ? (
          <>
            <div className="subject-icon-wrap flex h-10 w-10 shrink-0 items-center justify-center">
              <Lock className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <StatusLabel>მალე</StatusLabel>
              <h3 className="mt-0.5 font-bold text-slate-900 dark:text-white">{subject.title}</h3>
              <p className="text-xs text-slate-500 dark:text-gray-500">მალე გაიხსნება</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <StatusLabel>მალე</StatusLabel>
                <h3 className="mt-1 font-bold text-slate-900 dark:text-white">{subject.title}</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-gray-500">მალე გაიხსნება</p>
              </div>
              <div className="subject-icon-wrap flex h-10 w-10 shrink-0 items-center justify-center">
                <Lock className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
              </div>
            </div>
            <NeonProgressBar percent={0} accentHex={accent.accent} glowRgba={accent.glow} />
          </>
        )}
      </DashboardGlowCard>
    );
  }

  const isNew = subject.kind === "new";
  const percent = subject.kind === "active" ? subject.percent : 0;
  const stats =
    subject.kind === "active"
      ? `${subject.answered} / ${subject.total} კითხვა · ${subject.percent}%`
      : "დაიწყე მომზადება";

  return (
    <DashboardGlowCard
      accent={accent}
      href={subject.href}
      layoutId={`abit-subject-${subject.id}`}
      className={cardClass}
    >
      {isLive ? (
        <>
          <div
            className="subject-icon-wrap flex h-10 w-10 shrink-0 items-center justify-center transition duration-300 group-hover:shadow-[0_0_12px_var(--accent-color-glow)]"
            style={{ borderColor: `${accent.accent}44` }}
          >
            <Icon className={`h-5 w-5 ${accent.iconClass}`} strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            {isNew ? <StatusLabel>ახალი</StatusLabel> : null}
            <h3 className={`font-bold text-slate-900 dark:text-white ${isNew ? "mt-0.5" : ""}`}>
              {subject.title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-gray-400">{stats}</p>
            <NeonProgressBar percent={percent} accentHex={accent.accent} glowRgba={accent.glow} />
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 dark:text-zinc-500" />
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {isNew ? <StatusLabel>ახალი</StatusLabel> : null}
              <h3 className={`font-bold text-slate-900 dark:text-white ${isNew ? "mt-1" : ""}`}>
                {subject.title}
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-gray-400">{stats}</p>
            </div>
            <div
              className="subject-icon-wrap flex h-10 w-10 shrink-0 items-center justify-center transition duration-300 group-hover:shadow-[0_0_12px_var(--accent-color-glow)]"
              style={{ borderColor: `${accent.accent}44` }}
            >
              <Icon className={`h-5 w-5 ${accent.iconClass}`} strokeWidth={1.5} />
            </div>
          </div>
          <NeonProgressBar percent={percent} accentHex={accent.accent} glowRgba={accent.glow} />
          {isNew ? <StartButton label="დაიწყე" accentHex={accent.accent} /> : null}
        </>
      )}
    </DashboardGlowCard>
  );
}

export function AbiturientSubjects() {
  const { previewMode } = usePreviewMode();
  const isLive = isLivePreviewMode(previewMode);

  return (
    <div className="w-full min-w-0">
      <ActiveLearningCard subject={ABITURIENT_LAST_ACTIVE} isLive={isLive} />

      <DashboardMorphGrid variant="subjects">
        {ABITURIENT_SUBJECTS.map((subject) => (
          <DashboardMorphItem key={subject.id} id={`abit-subject-wrap-${subject.id}`}>
            <SubjectGridCard subject={subject} isLive={isLive} />
          </DashboardMorphItem>
        ))}
      </DashboardMorphGrid>

      <Link
        href="/dashboard-abit"
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-gradient-to-r from-white via-violet-50/50 to-cyan-50/50 py-3 text-sm text-slate-600 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/60 hover:text-violet-700 hover:shadow-md hover:shadow-violet-100/40 dark:border-white/10 dark:bg-none dark:bg-white/[0.02] dark:text-gray-400 dark:hover:border-purple-500/30 dark:hover:bg-white/[0.04] dark:hover:text-gray-200 dark:hover:shadow-[0_0_16px_rgba(168,85,247,0.15)]"
      >
        სრული პროგრამის ხედვა
        <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
      </Link>
    </div>
  );
}
