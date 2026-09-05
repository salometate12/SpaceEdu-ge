"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Award,
  ChevronLeft,
  Flame,
  Layers,
  Sparkles,
  Target,
} from "lucide-react";
import { DEFAULT_BADGES } from "@/lib/badges";
import type { UserProfile } from "@/lib/profile";
import { ABITURIENT_TOOLS } from "@/lib/abiturient-tools";
import { ABITURIENT_LAST_ACTIVE, ABITURIENT_SUBJECTS } from "@/lib/abiturient-subjects";
import {
  getToolUsageEvents,
  usageByTool,
  usageLast7Days,
  usageOnDay,
  type ToolUsageEvent,
} from "@/lib/activity";

interface AbiturientStatsViewProps {
  user: UserProfile;
}

const EMERALD = "#059669";
const CYAN = "#0891b2";
const AMBER = "#F59E0B";

function StatTile({
  icon: Icon,
  value,
  label,
  iconBg,
  iconColor,
}: {
  icon: typeof Award;
  value: string;
  label: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="dashboard-tool-card rounded-[26px] p-4 sm:p-5">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ background: iconBg, color: iconColor }}
      >
        <Icon className="h-4 w-4 stroke-[2.25]" />
      </div>
      <p className="mono mt-3 text-2xl font-black text-[var(--text-primary)]">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

function Gauge({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const size = 200;
  const strokeWidth = 14;
  const r = (size - strokeWidth) / 2 - 6;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const bgPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const angle = 180 - (clamped / 100) * 180;
  const theta = (angle * Math.PI) / 180;
  const ex = cx + r * Math.cos(theta);
  const ey = cy - r * Math.sin(theta);
  const progressPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${ex} ${ey}`;

  return (
    <svg viewBox={`0 0 ${size} ${size / 2 + 20}`} className="mx-auto w-full max-w-[240px]">
      <path d={bgPath} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} strokeLinecap="round" />
      {clamped > 0 && (
        <path d={progressPath} fill="none" stroke={EMERALD} strokeWidth={strokeWidth} strokeLinecap="round" />
      )}
      <text
        x={cx}
        y={cy - 16}
        textAnchor="middle"
        style={{ fontSize: 36, fontWeight: 900, fill: "var(--text-primary)" }}
      >
        {clamped}
      </text>
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        style={{ fontSize: 13, fontWeight: 700, fill: "var(--text-secondary)" }}
      >
        {label}
      </text>
    </svg>
  );
}

function ProgressRing({
  value,
  color,
  label,
}: {
  value: number;
  color: string;
  label: string;
}) {
  const size = 96;
  const strokeWidth = 9;
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: 20, fontWeight: 800, fill: "var(--text-primary)" }}
        >
          {clamped}%
        </text>
      </svg>
      <span className="max-w-[7rem] text-center text-xs font-semibold text-[var(--text-secondary)]">
        {label}
      </span>
    </div>
  );
}

function ActivityDots({ days }: { days: { label: string; count: number }[] }) {
  const maxDots = 8;
  return (
    <div className="grid grid-cols-7 gap-2 sm:gap-3">
      {days.map((day, idx) => {
        const filled = Math.min(day.count, maxDots);
        return (
          <div key={`${day.label}-${idx}`} className="flex flex-col items-center gap-1.5">
            <div className="flex flex-col-reverse gap-1">
              {Array.from({ length: maxDots }).map((_, dotIdx) => (
                <span
                  key={dotIdx}
                  className="h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5"
                  style={{ background: dotIdx < filled ? EMERALD : "var(--border)" }}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
              {day.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ToolUsageBars({ counts }: { counts: Record<string, number> }) {
  const max = Math.max(1, ...ABITURIENT_TOOLS.map((tool) => counts[tool.id] ?? 0));
  return (
    <div className="space-y-3.5">
      {ABITURIENT_TOOLS.map((tool) => {
        const count = counts[tool.id] ?? 0;
        const pct = Math.round((count / max) * 100);
        return (
          <div key={tool.id}>
            <div className="mb-1 flex items-center justify-between text-xs font-semibold">
              <span className="text-[var(--text-secondary)]">{tool.title}</span>
              <span className="text-[var(--text-primary)]">{count}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${count === 0 ? 0 : Math.max(pct, 6)}%`,
                  background: tool.accent.accent,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SubjectAnswerBreakdown() {
  const items = [
    ABITURIENT_LAST_ACTIVE,
    ...ABITURIENT_SUBJECTS.filter((subject) => subject.kind === "active"),
  ].map((subject) => ({
    name: subject.title,
    answered: subject.answered,
    color: subject.theme.glow,
  }));
  const total = items.reduce((sum, item) => sum + item.answered, 0) || 1;

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]">
        {items.map((item) =>
          item.answered > 0 ? (
            <div
              key={item.name}
              style={{ width: `${(item.answered / total) * 100}%`, background: item.color }}
              title={`${item.name}: ${item.answered}`}
            />
          ) : null,
        )}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="inline-flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
              <span className="truncate font-medium text-[var(--text-secondary)]">{item.name}</span>
            </span>
            <span className="shrink-0 font-bold text-[var(--text-primary)]">
              {Math.round((item.answered / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyUsageState() {
  return (
    <div className="dashboard-tool-card rounded-[32px] p-8 text-center sm:p-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        <Sparkles className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h3 className="headline mt-4 text-lg font-bold text-[var(--text-primary)]">
        სტატისტიკა ჯერ ცარიელია
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
        პროგრესი აქ გამოჩნდება შენი მოსამზადებელი აქტივობის მიხედვით. გახსენი რომელიმე
        ხელსაწყო — ვიქტორინა, AI კონსპექტი, უნივერსიტეტის კალკულატორი და სხვა — დეშბორდიდან,
        და აქ დაინახავ დეტალურ სტატისტიკას ხელსაწყოებისა და საგნების მიხედვით.
      </p>
      <Link
        href="/dashboard-abit"
        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90"
      >
        დეშბორდზე გადასვლა
      </Link>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="dashboard-tool-card animate-pulse rounded-[32px] p-8 sm:p-10">
      <div className="mx-auto h-4 w-40 rounded-full bg-[var(--bg-secondary)]" />
      <div className="mx-auto mt-3 h-3 w-64 max-w-full rounded-full bg-[var(--bg-secondary)]" />
    </div>
  );
}

export function AbiturientStatsView({ user }: AbiturientStatsViewProps) {
  const badges = DEFAULT_BADGES;
  const [events, setEvents] = useState<ToolUsageEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrate = () => {
      setEvents(getToolUsageEvents().filter((event) => event.toolId.startsWith("abit-")));
      setHydrated(true);
    };
    hydrate();
  }, []);

  const totalOpens = events.length;
  const todayOpens = usageOnDay(events, new Date());
  const last7 = usageLast7Days(events);
  const toolCounts = usageByTool(events);
  const unlockedBadges = badges.filter((badge) => badge.unlocked).length;

  const weekSum = last7.reduce((sum, day) => sum + day.count, 0);
  const streakScore = Math.min(user.currentStreak / 14, 1) * 50;
  const usageScore = Math.min(weekSum / 14, 1) * 50;
  const activityScore = Math.round(streakScore + usageScore);
  const scoreLabel =
    activityScore >= 85
      ? "შესანიშნავი"
      : activityScore >= 60
        ? "კარგი"
        : activityScore >= 30
          ? "საშუალო"
          : "დაწყებული";

  const subjectCards = [
    ABITURIENT_LAST_ACTIVE,
    ...ABITURIENT_SUBJECTS.filter((subject) => subject.kind === "active"),
  ];
  const avgSubjectProgress = subjectCards.length
    ? Math.round(subjectCards.reduce((sum, s) => sum + s.percent, 0) / subjectCards.length)
    : 0;
  const notStarted = ABITURIENT_SUBJECTS.filter((subject) => subject.kind !== "active");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="headline text-2xl font-bold text-[var(--text-primary)]">სტატისტიკა</h1>
        <Link
          href="/profile-abiturient"
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-all hover:border-emerald-400 hover:text-emerald-600"
        >
          <ChevronLeft className="h-4 w-4 stroke-[1.75]" />
          პროფილზე
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={Target}
          value={`${user.avgQuizScore}%`}
          label="საშ. Quiz შედეგი"
          iconBg="#cffafe"
          iconColor="#155e75"
        />
        <StatTile
          icon={Flame}
          value={String(user.currentStreak)}
          label="მიმდინარე სტრიკი"
          iconBg="#ffedd5"
          iconColor="#c2410c"
        />
        <StatTile
          icon={Award}
          value={`${unlockedBadges}/${badges.length}`}
          label="მოპოვებული ბეჯი"
          iconBg="#fef3c7"
          iconColor="#92400e"
        />
        <StatTile
          icon={Layers}
          value={hydrated ? String(totalOpens) : "…"}
          label="ხელსაწყოს გახსნა სულ"
          iconBg="#d1fae5"
          iconColor="#065f46"
        />
      </div>

      <div className="dashboard-tool-card rounded-[32px] p-6 sm:p-8">
        <h3 className="headline text-lg font-bold text-[var(--text-primary)]">საგნების პროგრესი</h3>
        <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">
          საშუალო პროგრესი აქტიურ საგნებში: {avgSubjectProgress}%
        </p>
        <div className="mt-4 space-y-4">
          {subjectCards.map((subject) => (
            <div key={subject.id}>
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                <span className="inline-flex items-center gap-2 text-[var(--text-secondary)]">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: `color-mix(in oklab, ${subject.theme.glow}, white 78%)` }}
                  >
                    <subject.icon className="h-3.5 w-3.5 stroke-[2.25]" style={{ color: subject.theme.glow }} />
                  </span>
                  {subject.title}
                </span>
                <span className="text-[var(--text-primary)]">
                  {subject.answered}/{subject.total} · {subject.percent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${subject.percent}%`, background: subject.theme.glow }}
                />
              </div>
            </div>
          ))}
        </div>
        {notStarted.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
            {notStarted.map((subject) => (
              <span
                key={subject.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)]"
              >
                <subject.icon className="h-3.5 w-3.5" style={{ color: subject.theme.glow }} />
                {subject.title} — {subject.kind === "locked" ? "დაბლოკილი" : "ჯერ არ დაწყებულა"}
              </span>
            ))}
          </div>
        )}
      </div>

      {!hydrated && <LoadingSkeleton />}

      {hydrated && totalOpens === 0 && <EmptyUsageState />}

      {hydrated && totalOpens > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="dashboard-tool-card rounded-[32px] p-6 sm:p-8">
              <h3 className="headline text-lg font-bold text-[var(--text-primary)]">აქტივობის ქულა</h3>
              <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">
                სტრიკისა და ბოლო კვირის აქტივობის მიხედვით
              </p>
              <div className="mt-4">
                <Gauge value={activityScore} label={scoreLabel} />
              </div>
            </div>

            <div className="dashboard-tool-card rounded-[32px] p-6 sm:p-8">
              <h3 className="headline text-lg font-bold text-[var(--text-primary)]">პროგრესის რგოლები</h3>
              <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">სწრაფი მიმოხილვა</p>
              <div className="mt-5 flex items-start justify-around gap-2">
                <ProgressRing value={avgSubjectProgress} color={EMERALD} label="საგნების პროგრესი" />
                <ProgressRing value={user.avgQuizScore} color={CYAN} label="Quiz სიზუსტე" />
                <ProgressRing
                  value={Math.round((user.currentStreak / Math.max(user.personalBestStreak, 1)) * 100)}
                  color={AMBER}
                  label="სტრიკი რეკორდთან"
                />
              </div>
            </div>

            <div className="dashboard-tool-card rounded-[32px] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-2">
                <h3 className="headline text-lg font-bold text-[var(--text-primary)]">ბოლო 7 დღე</h3>
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                  დღეს: {todayOpens}
                </span>
              </div>
              <div className="mt-6">
                <ActivityDots days={last7} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="dashboard-tool-card rounded-[32px] p-6 sm:p-8">
              <h3 className="headline text-lg font-bold text-[var(--text-primary)]">
                ხელსაწყოების გამოყენება
              </h3>
              <p className="mt-1 mb-4 text-xs font-medium text-[var(--text-muted)]">
                რომელ ხელსაწყოს იყენებ ყველაზე ხშირად
              </p>
              <ToolUsageBars counts={toolCounts} />
            </div>

            <div className="dashboard-tool-card rounded-[32px] p-6 sm:p-8">
              <h3 className="headline text-lg font-bold text-[var(--text-primary)]">
                პასუხების განაწილება საგნების მიხედვით
              </h3>
              <p className="mt-1 mb-4 text-xs font-medium text-[var(--text-muted)]">
                სულ პასუხგაცემული კითხვები საგნების მიხედვით
              </p>
              <SubjectAnswerBreakdown />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
