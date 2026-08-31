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
  {
    label: "ამ კვირის სესიები",
    value: "5",
    sub: "+2 | გასულ კვირაზე",
    color: "text-green-400",
    bg: "bg-yellow-400",
    text: "text-black",
    subText: "text-black/60",
  },
  {
    label: "Quiz სიზუსტე",
    value: "73%",
    sub: "+5% ამ თვეში",
    color: "text-purple-300",
    bg: "bg-pink-400",
    text: "text-black",
    subText: "text-black/60",
  },
  {
    label: "კვლევები",
    value: "8",
    sub: "ამ სემესტრში",
    color: "text-slate-300",
    bg: "bg-blue-500",
    text: "text-white",
    subText: "text-white/70",
  },
  {
    label: "CV განახლდა",
    value: "3 დღე",
    sub: "განაახლე",
    color: "text-amber-300",
    bg: "bg-emerald-400",
    text: "text-black",
    subText: "text-black/60",
  },
] as const;

const ACTIVITY_ICON = {
  quiz: Flame,
  study: BookOpen,
  ai: MessageSquare,
  cv: FileText,
  syllabus: GraduationCap,
} as const;

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
            {STUDENT_METRICS.map(({ label, value, sub, color, bg, text, subText }) => (
              <DashboardMorphItem key={label} id={`student-metric-${label}`}>
                <article
                  className={
                    isLive
                      ? "flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 transition-all duration-300 ease-in-out"
                      : `flex flex-col justify-between rounded-[28px] ${bg} px-5 py-5 transition-all duration-300 ease-in-out hover:-translate-y-1`
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
                    </>
                  )}
                </article>
              </DashboardMorphItem>
            ))}
          </DashboardMorphGrid>

          <StudentTools />

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="relative overflow-hidden rounded-[32px] bg-violet-500 p-6 transition-all duration-300 hover:-translate-y-1 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white">
                <BriefcaseBusiness className="h-5 w-5 stroke-[1.75]" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-white/70">კარიერა</p>
              <h3 className="mt-1 text-lg font-bold text-white">AI CV გენერატორი</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                შეავსე ინფორმაცია — AI შეგიქმნის პროფესიულ CV-ს სტაჟირებისა და ვაკანსიისთვის.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["სტაჟირება", "ვაკანსია", "ATS-ოპტიმიზაცია", "PDF ექსპორტი"].map((tag) => (
                  <span key={tag} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href="/cv"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-violet-700 transition-all hover:bg-white/90 active:scale-[0.98]"
              >
                <BriefcaseBusiness className="h-4 w-4" />
                CV-ის შექმნა
              </Link>
            </article>

            <article className="relative overflow-hidden rounded-[32px] bg-emerald-400 p-6 transition-all duration-300 hover:-translate-y-1 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/10 text-black">
                <GraduationCap className="h-5 w-5 stroke-[1.75]" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-black/60">სილაბუსი</p>
              <h3 className="mt-1 text-lg font-bold text-black">სილაბუსის AI ანალიზატორი</h3>
              <p className="mt-2 text-sm leading-relaxed text-black/70">
                ჩააგდე სილაბუსის PDF — AI გიმზადებს სემესტრის გეგმას, გამოცდებს და შუალედურ თარიღებს.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["სემ. გეგმა", "გამოცდის თარიღები", "Quiz კვირები", "შუალედური"].map((tag) => (
                  <span key={tag} className="rounded-full bg-black/10 px-3 py-1 text-xs font-semibold text-black">
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href="/syllabus"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-bold text-emerald-300 transition-all hover:bg-black/85 active:scale-[0.98]"
              >
                <GraduationCap className="h-4 w-4" />
                სილაბუსის ატვირთვა
              </Link>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-[28px] border-2 border-white/10 bg-[#121214] p-5">
              <h3 className="mb-4 text-lg font-bold text-white">საგნობრივი პროგრესი</h3>
              {[
                ["მონაცემთა სტრუქტურები", 68, "#a78bfa"],
                ["ალგორითმები", 84, "#22d3ee"],
                ["მათემატიკა", 55, "#4ade80"],
                ["სტატისტიკა", 41, "#fbbf24"],
              ].map(([subject, val, color]) => (
                <div key={String(subject)} className="mb-4 last:mb-0">
                  <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-300">
                    <span>{subject}</span>
                    <span>{val}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Number(val)}%`, backgroundColor: String(color) }}
                    />
                  </div>
                </div>
              ))}
            </article>

            <article className="rounded-[28px] border-2 border-white/10 bg-[#121214] p-5">
              <h3 className="mb-4 text-lg font-bold text-white">სწრაფი ქმედება</h3>
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
                    className="group flex items-center justify-between rounded-full border-2 border-white/10 px-3.5 py-2 text-sm font-semibold text-zinc-200 transition-all hover:border-white/25 hover:bg-white/[0.04]"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: String(color) }}
                      />
                      {label}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-zinc-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-white" />
                  </Link>
                ))}
              </div>
            </article>

            <article className="rounded-[28px] border-2 border-white/10 bg-[#121214] p-5">
              <h3 className="mb-4 text-lg font-bold text-white">დღიური აქტივობა</h3>
              <div className="space-y-3">
                {(
                  [
                    ["quiz", "Quiz — მოლეკულა სტრუქტურა", "10:24"],
                    ["study", "სასწავლო გეგმა განახლდა", "12:10"],
                    ["ai", "AI მასწავლებელი — მექანიკა", "14:30"],
                    ["cv", "CV განახლდა — სტაჟირება", "15:10"],
                    ["syllabus", "სილაბუსის ანალიზი", "16:00"],
                  ] as [keyof typeof ACTIVITY_ICON, string, string][]
                ).map(([type, title, time]) => {
                  const Icon = ACTIVITY_ICON[type];
                  const dot =
                    type === "quiz"
                      ? "bg-violet-500"
                      : type === "study"
                        ? "bg-cyan-500"
                        : type === "ai"
                          ? "bg-emerald-500"
                          : type === "cv"
                            ? "bg-fuchsia-500"
                            : "bg-pink-500";
                  return (
                    <div key={title} className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2.5">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${dot}`}
                        >
                          <Icon className="h-3.5 w-3.5 stroke-[2]" />
                        </span>
                        <span className="text-zinc-300">{title}</span>
                      </span>
                      <span className="text-xs font-semibold text-zinc-500">{time}</span>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}
