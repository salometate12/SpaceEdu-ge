"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  GraduationCap,
} from "lucide-react";
import { normalizeSmartSpace, type SmartSpace } from "@/lib/smart-space";
import { DashboardDecorIcons } from "./dashboard/DashboardDecorIcons";
import { DashboardGreetingBanner } from "./dashboard/DashboardGreetingBanner";
import { DashboardTopUtility } from "./dashboard/DashboardTopUtility";
import { StudentTools } from "./dashboard/StudentTools";
import {
  DashboardMorphGrid,
  DashboardMorphItem,
} from "./dashboard/DashboardMorphGrid";
import { AbiturientDashboard } from "./abiturient/AbiturientDashboard";
import { PreviewModeProvider, usePreviewMode } from "@/contexts/PreviewModeContext";
import { isLivePreviewMode } from "@/lib/dashboard-preview-layout";
import { useCurrentUserFirstName } from "@/hooks/useCurrentUserFirstName";

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
  ["ამ კვირის სესიები", "5", "+2 | გასულ კვირაზე", "text-green-400"],
  ["Quiz სიზუსტე", "73%", "+5% ამ თვეში", "text-purple-300"],
  ["კვლევები", "8", "ამ სემესტრში", "text-slate-300"],
  ["CV განახლდა", "3 დღე", "განაახლე", "text-amber-300"],
] as const;

function StudentDashboardView({ activeSpace }: { activeSpace: SmartSpace }) {
  const { previewMode } = usePreviewMode();
  const isLive = isLivePreviewMode(previewMode);
  const firstName = useCurrentUserFirstName();
  const fallbackGreeting = activeSpace === "university" ? "პროფი!" : "სტუდენტო!";

  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden">
      <DashboardDecorIcons />

      <main className="relative mx-auto flex w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <DashboardTopUtility />
        <div className="relative z-10 flex w-full flex-col gap-5 pt-10 sm:pt-12">
          <DashboardGreetingBanner
            workspace="student"
            badge={
              <span className="inline-flex rounded-full border border-violet-300/60 bg-gradient-to-r from-violet-50 to-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:border-[#7C3AED] dark:bg-[#2e1065] dark:text-[#c4b5fd]">
                სტუდენტის სივრცე
              </span>
            }
            title={firstName ? `გამარჯობა, ${firstName}!` : `გამარჯობა, ${fallbackGreeting}`}
            subtitle="დღეს გეგმაში: მონაცემთა სტრუქტურები — 2.5 საათი"
          />

          <DashboardMorphGrid variant="metrics">
            {STUDENT_METRICS.map(([label, value, sub, color]) => (
              <DashboardMorphItem key={label} id={`student-metric-${label}`}>
                <article
                  className={
                    isLive
                      ? "flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 transition-all duration-300 ease-in-out"
                      : "rounded-xl bg-[var(--bg-secondary)] px-4 py-4 transition-all duration-300 ease-in-out"
                  }
                >
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">{label}</p>
                    {isLive ? null : (
                      <p className="headline mt-1 text-3xl font-bold text-[var(--text-primary)]">{value}</p>
                    )}
                  </div>
                  <div className={isLive ? "text-right" : ""}>
                    {isLive ? (
                      <p className="headline text-2xl font-bold text-[var(--text-primary)]">{value}</p>
                    ) : null}
                    <p className={`${isLive ? "mt-0.5" : "mt-1"} text-xs ${color}`}>{sub}</p>
                  </div>
                </article>
              </DashboardMorphItem>
            ))}
          </DashboardMorphGrid>

          <StudentTools />

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="dashboard-section p-6 transition-all duration-300 hover:border-violet-300/60 dark:hover:border-purple-500/40 dark:shadow-[0_0_20px_rgba(168,85,247,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-[#a78bfa]">კარიერა</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">AI CV გენერატორი</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                შეავსე ინფორმაცია — AI შეგიქმნის პროფესიულ CV-ს სტაჟირებისა და ვაკანსიისთვის.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["სტაჟირება", "ვაკანსია", "ATS-ოპტიმიზაცია", "PDF ექსპორტი"].map((tag) => (
                  <span key={tag} className="rounded-md border border-violet-300/60 bg-violet-50 px-2 py-0.5 text-xs text-violet-700 dark:border-[#7C3AED] dark:bg-transparent dark:text-[#c4b5fd]">
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href="/cv"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#7C3AED] px-3 py-2 text-sm font-semibold text-white hover:bg-[#6d28d9]"
              >
                <BriefcaseBusiness className="h-4 w-4" />
                CV-ის შექმნა
              </Link>
            </article>

            <article className="dashboard-section p-6 transition-all duration-300 hover:border-emerald-300/60 dark:hover:border-purple-500/40 dark:shadow-[0_0_20px_rgba(34,197,94,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-[#86efac]">სილაბუსი</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">სილაბუსის AI ანალიზატორი</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                ჩააგდე სილაბუსის PDF — AI გიმზადებს სემესტრის გეგმას, გამოცდებს და შუალედურ თარიღებს.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["სემ. გეგმა", "გამოცდის თარიღები", "Quiz კვირები", "შუალედური"].map((tag) => (
                  <span key={tag} className="rounded-md border border-emerald-300/60 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:border-[#22c55e] dark:bg-transparent dark:text-[#86efac]">
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href="/syllabus"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#22c55e] px-3 py-2 text-sm font-semibold text-[#05220f] hover:bg-[#4ade80]"
              >
                <GraduationCap className="h-4 w-4" />
                სილაბუსის ატვირთვა
              </Link>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
              <h3 className="headline mb-3 text-lg font-semibold">საგნობრივი პროგრესი</h3>
              {[
                ["მონაცემთა სტრუქტურები", 68, "#7C3AED"],
                ["ალგორითმები", 84, "#22d3ee"],
                ["მათემატიკა", 55, "#22c55e"],
                ["სტატისტიკა", 41, "#f59e0b"],
              ].map(([subject, val, color]) => (
                <div key={String(subject)} className="mb-3 last:mb-0">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>{subject}</span>
                    <span>{val}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Number(val)}%`, backgroundColor: String(color) }}
                    />
                  </div>
                </div>
              ))}
            </article>

            <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
              <h3 className="headline mb-3 text-lg font-semibold">სწრაფი ქმედება</h3>
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
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:border-[var(--border-hover)]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: String(color) }} />
                      {label}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[var(--text-muted)]" />
                  </Link>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
              <h3 className="headline mb-3 text-lg font-semibold">დღიური აქტივობა</h3>
              <div className="space-y-2">
                {[
                  ["quiz", "Quiz — მოლეკულა სტრუქტურა", "10:24"],
                  ["study", "სასწავლო გეგმა განახლდა", "12:10"],
                  ["ai", "AI მასწავლებელი — მექანიკა", "14:30"],
                  ["cv", "CV განახლდა — სტაჟირება", "15:10"],
                  ["syllabus", "სილაბუსის ანალიზი", "16:00"],
                ].map(([type, title, time]) => (
                  <div key={String(title)} className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background:
                            type === "quiz"
                              ? "#7C3AED"
                              : type === "study"
                                ? "#22d3ee"
                                : type === "ai"
                                  ? "#22c55e"
                                  : type === "cv"
                                    ? "#a78bfa"
                                    : "#f472b6",
                        }}
                      />
                      <span className="text-[var(--text-secondary)]">{title}</span>
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{time}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}
