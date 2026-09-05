"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  FileText,
  Flame,
  GraduationCap,
  MessageSquare,
} from "lucide-react";
import { normalizeSmartSpace, type SmartSpace } from "@/lib/smart-space";
import { DashboardDecorIcons } from "./dashboard/DashboardDecorIcons";
import { DashboardGreetingBanner } from "./dashboard/DashboardGreetingBanner";
import { DashboardSideRail } from "./dashboard/DashboardSideRail";
import { DashboardCalendarPanel } from "./dashboard/DashboardCalendarPanel";
import { StudentTools } from "./dashboard/StudentTools";
import { SemesterSubjects } from "./dashboard/SemesterSubjects";
import { StudentStudyCalendar } from "./dashboard/StudentStudyCalendar";
import { DailyGoals } from "./profile/DailyGoals";
import { DASHBOARD_GOALS_STORAGE_KEY } from "@/lib/profile";
import { DashboardJournalWidget } from "./lecture-notes/DashboardJournalWidget";
import { DashboardLectureStickers } from "./lecture-notes/DashboardLectureStickers";
import {
  DashboardMorphGrid,
  DashboardMorphItem,
} from "./dashboard/DashboardMorphGrid";
import { AbiturientDashboard } from "./abiturient/AbiturientDashboard";
import { PreviewModeProvider, usePreviewMode } from "@/contexts/PreviewModeContext";
import { isLivePreviewMode } from "@/lib/dashboard-preview-layout";
import { useCurrentUserFirstName } from "@/hooks/useCurrentUserFirstName";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import type { ActivityEntry, DashboardMetrics } from "@/lib/dashboard-metrics";

interface DashboardProps {
  initialSpace?: SmartSpace;
}

export function Dashboard({ initialSpace }: DashboardProps = {}) {
  const [activeSpace] = useState<SmartSpace>(() => {
    if (initialSpace) return initialSpace;
    if (typeof window === "undefined") return "exam";
    const saved = window.localStorage.getItem("spaceedu-active-space");
    return normalizeSmartSpace(saved ?? undefined);
  });

  useEffect(() => {
    window.localStorage.setItem("spaceedu-active-space", activeSpace);
  }, [activeSpace]);

  if (activeSpace === "exam") {
    return <AbiturientDashboard />;
  }

  return (
    <PreviewModeProvider>
      <StudentDashboardView activeSpace={activeSpace} />
    </PreviewModeProvider>
  );
}

const STUDENT_METRICS = [
  {
    key: "sessions" as const,
    label: "ამ კვირის სესიები",
    color: "text-green-400",
    card: "border border-amber-200 bg-amber-100 dark:border-transparent dark:bg-yellow-400",
    mobileVivid: "mobile-vivid-metric-yellow",
    text: "text-zinc-900 dark:text-black",
    subText: "text-zinc-500 dark:text-black/60",
    chart: "bars" as const,
    chartColor: "text-amber-600 dark:text-black/35",
  },
  {
    key: "quiz" as const,
    label: "Quiz სიზუსტე",
    color: "text-purple-300",
    card: "border border-pink-200 bg-pink-100 dark:border-transparent dark:bg-pink-400",
    mobileVivid: "mobile-vivid-metric-pink",
    text: "text-zinc-900 dark:text-black",
    subText: "text-zinc-500 dark:text-black/60",
    chart: "line" as const,
    chartColor: "text-pink-600 dark:text-black/35",
  },
  {
    key: "research" as const,
    label: "კვლევები",
    color: "text-slate-300",
    card: "border border-sky-200 bg-sky-100 dark:border-transparent dark:bg-blue-500",
    mobileVivid: "mobile-vivid-metric-blue",
    text: "text-zinc-900 dark:text-white",
    subText: "text-zinc-500 dark:text-white/70",
    chart: "none" as const,
    chartColor: "",
  },
  {
    key: "cv" as const,
    label: "CV განახლდა",
    color: "text-amber-300",
    card: "border border-emerald-200 bg-emerald-100 dark:border-transparent dark:bg-emerald-400",
    mobileVivid: "mobile-vivid-metric-emerald",
    text: "text-zinc-900 dark:text-black",
    subText: "text-zinc-500 dark:text-black/60",
    chart: "none" as const,
    chartColor: "",
  },
] as const;

type StudentMetricKey = (typeof STUDENT_METRICS)[number]["key"];

/** Turns the raw per-user metrics into the `{ value, sub }` each card shows.
 * `null` metrics (server render / first paint) get a neutral placeholder so
 * we never flash invented numbers. */
function metricDisplay(
  key: StudentMetricKey,
  m: DashboardMetrics | null,
): { value: string; sub: string } {
  if (!m) return { value: "—", sub: "" };

  switch (key) {
    case "sessions": {
      const d = m.sessionsDelta;
      const sub =
        m.sessionsThisWeek === 0
          ? "ჯერ არ დაგიწყია ამ კვირას"
          : d > 0
            ? `+${d} გასულ კვირასთან`
            : d < 0
              ? `${d} გასულ კვირასთან`
              : "იგივე, რაც გასულ კვირას";
      return { value: String(m.sessionsThisWeek), sub };
    }
    case "quiz": {
      if (m.quizAccuracy === null) {
        return { value: "—", sub: "გაიარე პირველი ქვიზი" };
      }
      const d = m.quizAccuracyDelta;
      const sub =
        d === null
          ? "საშუალო სიზუსტე"
          : d > 0
            ? `+${d}% ამ თვეში`
            : d < 0
              ? `${d}% ამ თვეში`
              : "უცვლელი ამ თვეში";
      return { value: `${m.quizAccuracy}%`, sub };
    }
    case "research":
      return { value: String(m.researchThisSemester), sub: "ამ სემესტრში" };
    case "cv": {
      if (m.cvUpdatedDaysAgo === null) return { value: "ჯერ არა", sub: "შექმენი" };
      if (m.cvUpdatedDaysAgo === 0) return { value: "დღეს", sub: "განახლებულია" };
      if (m.cvUpdatedDaysAgo === 1) return { value: "გუშინ", sub: "განაახლე" };
      return { value: `${m.cvUpdatedDaysAgo} დღის წინ`, sub: "განაახლე" };
    }
    default:
      return { value: "—", sub: "" };
  }
}

function activityTimeLabel(at: number): string {
  const now = new Date();
  const then = new Date(at);
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const startOfThen = new Date(then).setHours(0, 0, 0, 0);
  const dayDiff = Math.round((startOfToday - startOfThen) / 86_400_000);
  if (dayDiff <= 0) {
    return `${String(then.getHours()).padStart(2, "0")}:${String(then.getMinutes()).padStart(2, "0")}`;
  }
  if (dayDiff === 1) return "გუშინ";
  return `${then.getDate()}.${String(then.getMonth() + 1).padStart(2, "0")}`;
}

const ACTIVITY_ICON = {
  quiz: Flame,
  study: BookOpen,
  ai: MessageSquare,
  cv: FileText,
  syllabus: GraduationCap,
} as const;

function MiniBars({ className }: { className?: string }) {
  const heights = [7, 14, 10, 18, 13];
  return (
    <svg viewBox="0 0 40 20" className={className} fill="none" aria-hidden>
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * 8}
          y={20 - h}
          width={5}
          height={h}
          rx={1.5}
          fill="currentColor"
          opacity={0.35 + i * 0.13}
        />
      ))}
    </svg>
  );
}

function MiniLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 22" className={className} fill="none" aria-hidden>
      <polyline
        points="0,16 12,18 22,8 34,12 46,3 60,7"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.65}
      />
    </svg>
  );
}

function StudentDashboardView({ activeSpace }: { activeSpace: SmartSpace }) {
  const { previewMode } = usePreviewMode();
  const isLive = isLivePreviewMode(previewMode);
  const firstName = useCurrentUserFirstName();
  const { metrics, activity } = useDashboardMetrics();
  const fallbackGreeting = activeSpace === "university" ? "პროფი!" : "სტუდენტო!";
  const [goalsOnDashboard, setGoalsOnDashboard] = useState(false);

  useEffect(() => {
    const readGoalsPref = () => {
      setGoalsOnDashboard(window.localStorage.getItem(DASHBOARD_GOALS_STORAGE_KEY) === "1");
    };
    readGoalsPref();
  }, []);

  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden">
      <DashboardDecorIcons />

      <main className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 py-6 max-[639px]:px-0 max-[639px]:pt-0 sm:px-6 sm:py-8 lg:py-10 xl:flex-row">
        <DashboardSideRail />
        <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-5 pt-10 max-[639px]:pt-0 sm:pt-12">
          <DashboardGreetingBanner
            workspace="student"
            badge={
              <span className="inline-flex rounded-full border border-amber-300/70 bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:border-amber-400/35 dark:bg-amber-400/10 dark:text-amber-300">
                სტუდენტის სივრცე
              </span>
            }
            title={firstName ? `გამარჯობა, ${firstName}!` : `გამარჯობა, ${fallbackGreeting}`}
            subtitle="დღეს გეგმაში: მონაცემთა სტრუქტურები — 2.5 საათი"
          />

          <div className="flex flex-col gap-5 max-[639px]:px-4">
          <DashboardMorphGrid variant="metrics" className="mobile-stack-tools">
            {STUDENT_METRICS.map(
              ({ key, label, color, card, mobileVivid, text, subText, chart, chartColor }) => {
                const { value, sub } = metricDisplay(key, metrics);
                return (
                <DashboardMorphItem
                  key={label}
                  id={`student-metric-${label}`}
                  className="mobile-stack-tool-item"
                >
                  <article
                    className={
                      isLive
                        ? "flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 transition-all duration-300 ease-in-out"
                        : `relative flex flex-col justify-between overflow-hidden rounded-[28px] ${card} ${mobileVivid} px-5 py-5 transition-all duration-300 ease-in-out hover:-translate-y-1`
                    }
                  >
                    {isLive ? (
                      <>
                        <div>
                          <p className="text-xs text-[var(--text-secondary)]">{label}</p>
                        </div>
                        <div className="text-right">
                          <p className="headline text-2xl font-bold text-[var(--text-primary)]">{value}</p>
                          <p className={`mt-0.5 text-xs ${color}`}>{sub}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className={`text-xs font-bold uppercase tracking-wide ${subText}`}>{label}</p>
                        <div>
                          <p className={`mt-3 text-3xl font-black tracking-tight ${text}`}>{value}</p>
                          <p className={`mt-1 text-xs font-semibold ${subText}`}>{sub}</p>
                        </div>
                        {chart === "bars" && (
                          <MiniBars className={`absolute bottom-5 right-5 h-6 w-11 ${chartColor}`} />
                        )}
                        {chart === "line" && (
                          <MiniLine className={`absolute bottom-6 right-4 h-6 w-14 ${chartColor}`} />
                        )}
                        <span className="absolute right-4 top-4 hidden max-[639px]:flex max-[639px]:h-8 max-[639px]:w-8 max-[639px]:items-center max-[639px]:justify-center max-[639px]:rounded-full max-[639px]:bg-black/10">
                          <ArrowUpRight className={`h-4 w-4 ${text}`} strokeWidth={2} />
                        </span>
                      </>
                    )}
                  </article>
                </DashboardMorphItem>
                );
              },
            )}
          </DashboardMorphGrid>

          <StudentTools />

          <DashboardJournalWidget />

          <DashboardLectureStickers />

          <SemesterSubjects />

          <StudentStudyCalendar />

          {goalsOnDashboard && (
            <div className="dashboard-tool-card rounded-[32px] p-6 sm:p-8">
              <DailyGoals title="ჩემი მიზნები" />
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="relative overflow-hidden rounded-[32px] border border-violet-200 bg-violet-100 p-6 transition-all duration-300 hover:-translate-y-1 dark:border-transparent dark:bg-violet-500 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500/10 text-violet-700 dark:bg-white/20 dark:text-white">
                <BriefcaseBusiness className="h-5 w-5 stroke-[1.75]" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-violet-700/70 dark:text-white/70">კარიერა</p>
              <h3 className="mt-1 text-lg font-bold text-violet-950 dark:text-white">AI CV გენერატორი</h3>
              <p className="mt-2 text-sm leading-relaxed text-violet-900/70 dark:text-white/80">
                შეავსე ინფორმაცია — AI შეგიქმნის პროფესიულ CV-ს სტაჟირებისა და ვაკანსიისთვის.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["სტაჟირება", "ვაკანსია", "ATS-ოპტიმიზაცია", "PDF ექსპორტი"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-white/15 dark:text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href="/cv"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-violet-700 active:scale-[0.98] dark:bg-white dark:text-violet-700 dark:hover:bg-white/90"
              >
                <BriefcaseBusiness className="h-4 w-4" />
                CV-ის შექმნა
              </Link>
            </article>

            <article className="relative overflow-hidden rounded-[32px] border border-emerald-200 bg-emerald-100 p-6 transition-all duration-300 hover:-translate-y-1 dark:border-transparent dark:bg-emerald-400 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:bg-black/10 dark:text-black">
                <GraduationCap className="h-5 w-5 stroke-[1.75]" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-emerald-700/70 dark:text-black/60">სილაბუსი</p>
              <h3 className="mt-1 text-lg font-bold text-emerald-950 dark:text-black">სილაბუსის AI ანალიზატორი</h3>
              <p className="mt-2 text-sm leading-relaxed text-emerald-900/70 dark:text-black/70">
                ჩააგდე სილაბუსის PDF — AI გიმზადებს სემესტრის გეგმას, გამოცდებს და შუალედურ თარიღებს.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["სემ. გეგმა", "გამოცდის თარიღები", "Quiz კვირები", "შუალედური"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-black/10 dark:text-black"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href="/syllabus"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700 active:scale-[0.98] dark:bg-black dark:text-emerald-300 dark:hover:bg-black/85"
              >
                <GraduationCap className="h-4 w-4" />
                სილაბუსის ატვირთვა
              </Link>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-[28px] border border-slate-200 bg-white p-5 dark:border-2 dark:border-white/10 dark:bg-[#121214]">
              <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">საგნობრივი პროგრესი</h3>
              {[
                ["მონაცემთა სტრუქტურები", 68, "#a78bfa"],
                ["ალგორითმები", 84, "#22d3ee"],
                ["მათემატიკა", 55, "#4ade80"],
                ["სტატისტიკა", 41, "#fbbf24"],
              ].map(([subject, val, color]) => (
                <div key={String(subject)} className="mb-4 last:mb-0">
                  <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-zinc-300">
                    <span>{subject}</span>
                    <span>{val}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Number(val)}%`, backgroundColor: String(color) }}
                    />
                  </div>
                </div>
              ))}
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-5 dark:border-2 dark:border-white/10 dark:bg-[#121214]">
              <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">სწრაფი ქმედება</h3>
              <div className="grid gap-2">
                {[
                  ["#7C3AED", "ახალი სასწავლო გეგმა", "/study-plan"],
                  ["#22d3ee", "Quiz რეჟიმი", "/quiz"],
                  ["#22c55e", "AI მასწავლებელი", "/ai-teacher"],
                  ["#a78bfa", "CV-ის შექმნა", "/cv"],
                  ["#f472b6", "სილაბუსის ატვირთვა", "/syllabus"],
                ].map(([color, label, href]) => (
                  <Link
                    key={String(label)}
                    href={String(href)}
                    className="group flex items-center justify-between rounded-full border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-2 dark:border-white/10 dark:text-zinc-200 dark:hover:border-white/25 dark:hover:bg-white/[0.04]"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: String(color) }}
                      />
                      {label}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-900 dark:text-zinc-500 dark:group-hover:text-white" />
                  </Link>
                ))}
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-5 dark:border-2 dark:border-white/10 dark:bg-[#121214]">
              <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">ბოლო აქტივობა</h3>
              {activity && activity.length === 0 ? (
                <p className="text-sm leading-relaxed text-slate-500 dark:text-zinc-500">
                  ჯერ აქტივობა არ გაქვს — გახსენი რომელიმე ხელსაწყო და აქ გამოჩნდება.
                </p>
              ) : (
                <div className="space-y-3">
                  {(activity ?? []).map((entry: ActivityEntry, index) => {
                    const Icon = ACTIVITY_ICON[entry.category];
                    const dot =
                      entry.category === "quiz"
                        ? "bg-violet-500"
                        : entry.category === "study"
                          ? "bg-cyan-500"
                          : entry.category === "ai"
                            ? "bg-emerald-500"
                            : entry.category === "cv"
                              ? "bg-fuchsia-500"
                              : "bg-pink-500";
                    return (
                      <div
                        key={`${entry.at}-${index}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="inline-flex min-w-0 items-center gap-2.5">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${dot}`}
                          >
                            <Icon className="h-3.5 w-3.5 stroke-[2]" />
                          </span>
                          <span className="truncate text-slate-700 dark:text-zinc-300">
                            {entry.title}
                          </span>
                        </span>
                        <span className="shrink-0 pl-2 text-xs font-semibold text-slate-400 dark:text-zinc-500">
                          {activityTimeLabel(entry.at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          </section>
          <div id="dashboard-calendar-panel" className="scroll-mt-24">
            <DashboardCalendarPanel variant="inline" />
          </div>
          </div>
        </div>
        <DashboardCalendarPanel />
      </main>
    </div>
  );
}
