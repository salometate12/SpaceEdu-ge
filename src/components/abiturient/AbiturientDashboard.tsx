"use client";

import { GraduationCap } from "lucide-react";
import { AbiturientSubjects } from "./AbiturientSubjects";
import { AbiturientTools } from "./AbiturientTools";
import { AbiturientStudyCalendar } from "./AbiturientStudyCalendar";
import { AbiturientLibrary } from "./AbiturientLibrary";
import { AbiturientNotesWidget } from "./AbiturientNotesWidget";
import { DashboardGreetingBanner } from "@/components/dashboard/DashboardGreetingBanner";
import { DashboardSideRail } from "@/components/dashboard/DashboardSideRail";
import { DashboardCalendarPanel } from "@/components/dashboard/DashboardCalendarPanel";
import { PreviewModeProvider } from "@/contexts/PreviewModeContext";
import { useCurrentUserFirstName } from "@/hooks/useCurrentUserFirstName";

export function AbiturientDashboard() {
  const firstName = useCurrentUserFirstName();

  return (
    <PreviewModeProvider>
      <div className="relative flex min-h-full flex-col overflow-x-hidden">
      <main className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 py-6 max-[639px]:px-0 max-[639px]:pt-0 sm:px-6 sm:py-8 lg:py-10 xl:flex-row">
        <DashboardSideRail space="abiturient" />
        <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-5 pt-10 max-[639px]:pt-0 sm:pt-12">
          <DashboardGreetingBanner
            workspace="abiturient"
            badge={
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-cyan-300 bg-cyan-100 px-3 py-1.5 text-xs font-bold text-cyan-700 dark:border-[#22d3ee] dark:bg-[#042f3d] dark:text-[#67e8f9]">
                <GraduationCap className="h-3.5 w-3.5" />
                აბიტურიენტი
              </span>
            }
            title={firstName ? `გამარჯობა, ${firstName}!` : "გამარჯობა, აბიტურიენტო!"}
            subtitle="საგნები, სასწავლო ინსტრუმენტები და ბიბლიოთეკა ერთ სივრცეში."
          />

          <section className="dashboard-panel p-5 sm:p-6">
            <div
              className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-violet-400/30 blur-[80px] dark:bg-purple-600/15"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-cyan-400/25 blur-[70px] dark:bg-cyan-500/10"
              aria-hidden
            />
            <div className="relative z-[1]">
              <p className="mb-8 text-slate-600 dark:text-gray-400">
                აირჩიე საგანი ან განაგრძე ბოლო აქტიური მომზადება.
              </p>
              <AbiturientSubjects />
            </div>
          </section>

          <AbiturientTools />

          <AbiturientNotesWidget />

          <AbiturientStudyCalendar />

          <AbiturientLibrary />

          <div id="dashboard-calendar-panel" className="scroll-mt-24">
            <DashboardCalendarPanel variant="inline" />
          </div>
        </div>
        <DashboardCalendarPanel />
      </main>
      </div>
    </PreviewModeProvider>
  );
}
