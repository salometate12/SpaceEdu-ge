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
import { aiTeacherHrefForSpace } from "@/lib/access-control";
import { DashboardDecorIcons } from "./dashboard/DashboardDecorIcons";
import { DashboardGreetingBanner } from "./dashboard/DashboardGreetingBanner";
import { DashboardStatCards } from "./dashboard/DashboardStatCards";
import { DashboardSideRail } from "./dashboard/DashboardSideRail";
import { DashboardCalendarPanel } from "./dashboard/DashboardCalendarPanel";
import { StudentTools } from "./dashboard/StudentTools";
import { ContinueCard } from "./library/ContinueCard";
import { SemesterSubjects } from "./dashboard/SemesterSubjects";
import { StudentStudyCalendar } from "./dashboard/StudentStudyCalendar";
import { DailyGoals } from "./profile/DailyGoals";
import { SubjectProgress } from "./profile/SubjectProgress";
import { DASHBOARD_GOALS_STORAGE_KEY } from "@/lib/profile";
import { DashboardJournalWidget } from "./lecture-notes/DashboardJournalWidget";
import { ImportantDocuments } from "./dashboard/ImportantDocuments";
import { DashboardLectureStickers } from "./lecture-notes/DashboardLectureStickers";
import { AbiturientDashboard } from "./abiturient/AbiturientDashboard";
import { PreviewModeProvider } from "@/contexts/PreviewModeContext";
import { useCurrentUserFirstName } from "@/hooks/useCurrentUserFirstName";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import type { ActivityEntry } from "@/lib/dashboard-metrics";
import { DASHBOARD_GOALS_TOGGLE_EVENT } from "@/lib/user-data-keys";

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

function StudentDashboardView({ activeSpace }: { activeSpace: SmartSpace }) {
  const firstName = useCurrentUserFirstName();
  const { metrics, activity } = useDashboardMetrics();
  const fallbackGreeting = activeSpace === "university" ? "პროფი!" : "სტუდენტო!";
  const [goalsOnDashboard, setGoalsOnDashboard] = useState(false);

  useEffect(() => {
    const readGoalsPref = () => {
      setGoalsOnDashboard(window.localStorage.getItem(DASHBOARD_GOALS_STORAGE_KEY) === "1");
    };
    readGoalsPref();
    // Switched on or off on another device.
    window.addEventListener(DASHBOARD_GOALS_TOGGLE_EVENT, readGoalsPref);
    return () => window.removeEventListener(DASHBOARD_GOALS_TOGGLE_EVENT, readGoalsPref);
  }, []);

  // A warm off-white ground so the white cards stand off the page. Scoped
  // to this view through an attribute on <html>, because the page colour
  // is painted by <body>; globals.css maps it to --dashboard-surface.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.surface = "student-dashboard";
    return () => {
      delete root.dataset.surface;
    };
  }, []);

  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden">
      <DashboardDecorIcons />

      <main className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 py-6 max-[639px]:px-0 max-[639px]:pt-0 sm:px-6 sm:py-8 lg:py-10 xl:flex-row">
        <DashboardSideRail />
        <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-5 pt-10 max-[639px]:pt-0 sm:pt-12">
          <DashboardGreetingBanner
            workspace="student"
            title={firstName ? `გამარჯობა, ${firstName}!` : `გამარჯობა, ${fallbackGreeting}`}
          />

          <div className="flex flex-col gap-5 max-[639px]:px-4">
          <DashboardStatCards metrics={metrics} />

          <ContinueCard />

          <StudentTools />

          <DashboardJournalWidget />

          <ImportantDocuments />

          <DashboardLectureStickers />

          {/* The AI teacher's „დაამატე შენი საგნები“ links here. */}
          <div id="semester-subjects" className="scroll-mt-[calc(var(--site-header-h)+1rem)]">
            <SemesterSubjects />
          </div>

          <StudentStudyCalendar />

          {goalsOnDashboard && <DailyGoals title="ჩემი მიზნები" />}

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="relative overflow-hidden rounded-[32px] border border-pink-200 bg-pink-100 p-6 transition-all duration-300 hover:-translate-y-1 dark:border-transparent dark:bg-pink-500 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-pink-500/10 text-pink-700 dark:bg-white/20 dark:text-white">
                <BriefcaseBusiness className="h-5 w-5 stroke-[1.75]" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-pink-700/70 dark:text-white/70">კარიერა</p>
              <h3 className="mt-1 text-lg font-bold text-pink-950 dark:text-white">AI CV გენერატორი</h3>
              <p className="mt-2 text-sm leading-relaxed text-pink-900/70 dark:text-white/80">
                შეავსე ინფორმაცია — AI შეგიქმნის პროფესიულ CV-ს სტაჟირებისა და ვაკანსიისთვის.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["სტაჟირება", "ვაკანსია", "ATS-ოპტიმიზაცია", "PDF ექსპორტი"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-pink-500/10 px-3 py-1 text-xs font-semibold text-pink-700 dark:bg-white/15 dark:text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href="/cv"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-pink-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-pink-700 active:scale-[0.98] dark:bg-white dark:text-pink-700 dark:hover:bg-white/90"
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
            {/* The real subjects, from the semester the student set up — the
                four names and percentages that used to sit here were
                invented, and stayed the same whatever anyone studied. */}
            <SubjectProgress />

            <article className="rounded-[28px] border border-slate-200 bg-white p-5 dark:border-2 dark:border-white/10 dark:bg-[#121214]">
              <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">სწრაფი ქმედება</h3>
              <div className="grid gap-2">
                {[
                  ["#7C3AED", "ახალი სასწავლო გეგმა", "/study-plan"],
                  ["#22d3ee", "Quiz რეჟიმი", "/quiz"],
                  ["#22c55e", "AI მასწავლებელი", aiTeacherHrefForSpace(activeSpace === "university" ? "student" : "school")],
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
                        ? "bg-pink-500"
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
