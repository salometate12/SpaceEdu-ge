"use client";

import { AbiturientSubjects } from "./AbiturientSubjects";
import { AbiturientTools } from "./AbiturientTools";
import { AbiturientStudyCalendar } from "./AbiturientStudyCalendar";
import { AbiturientLibrary } from "./AbiturientLibrary";
import { DashboardGreetingBanner } from "@/components/dashboard/DashboardGreetingBanner";
import { DashboardTopUtility } from "@/components/dashboard/DashboardTopUtility";
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
          <DashboardTopUtility />
          <DashboardGreetingBanner
            workspace="abiturient"
            badge={
              <span className="inline-flex rounded-full border border-emerald-400/40 bg-gradient-to-r from-emerald-50 to-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-500/25 dark:from-emerald-500/10 dark:to-transparent dark:text-emerald-200">
                Abiturient Workspace
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
