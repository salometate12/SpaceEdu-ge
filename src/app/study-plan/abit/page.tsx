"use client";

import Link from "next/link";
import { useState } from "react";
import { AbitStudyPlanForm } from "@/components/StudyPlan/AbitStudyPlanForm";
import type { StudyPlanFormValues } from "@/components/StudyPlan/StudyPlanForm";
import { CalendarView } from "@/components/StudyPlan/CalendarView";
import { StudyPlanThinkingLoader } from "@/components/StudyPlan/StudyPlanThinkingLoader";
import { SyllabusEventsPanel } from "@/components/syllabus/SyllabusEventsPanel";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import { DASHBOARD_ABIT_HREF } from "@/lib/dashboard-routes";
import type { StudyPlanResponse } from "@/lib/ai/study-plan-schema";

export default function AbitStudyPlanPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudyPlanResponse | null>(null);
  const [subjectTitle, setSubjectTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const generatePlan = async (values: StudyPlanFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAiJson<StudyPlanResponse>({
        pageType: "study-plan",
        payload: { ...values, preparationLevel: "intermediate" },
        responseMode: "json",
      });
      setResult(data);
      setSubjectTitle(values.subject);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-start gap-3">
        <Link
          href={DASHBOARD_ABIT_HREF}
          className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-purple-400/30 dark:hover:bg-purple-500/10 dark:hover:text-white"
          aria-label="Dashboard"
        >
          ←
        </Link>
        <div>
          <h1 className="headline text-2xl font-bold text-slate-900 sm:text-3xl dark:text-zinc-100">
            სასწავლო გეგმის გენერატორი
          </h1>
          <p className="mt-1 max-w-4xl text-sm text-slate-600 dark:text-zinc-400">
            აირჩიე საგანი და თემები ერთი შეხებით — AI დღეებზე გაგიწერს მომზადების გრაფიკს
          </p>
        </div>
      </div>

      <section className="mt-6 flex w-full flex-col items-stretch gap-6 lg:flex-row">
        <div className="w-full flex-shrink-0 lg:w-[380px]">
          <AbitStudyPlanForm loading={loading} onSubmit={generatePlan} />
          {error && (
            <div className="mt-4 rounded-xl border border-rose-300/50 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}
        </div>

        <div className="dashboard-section min-h-[500px] flex-1 p-6">
          {loading ? (
            <StudyPlanThinkingLoader />
          ) : result ? (
            <CalendarView
              plan={result.plan}
              totalDays={result.total_days}
              advice={result.advice}
              subject={subjectTitle}
              space="abiturient"
            />
          ) : (
            <div className="flex h-full flex-col">
              <SyllabusEventsPanel />
              <div className="flex flex-1 items-center justify-center text-center">
                <p className="text-sm text-slate-500 dark:text-zinc-500">
                  შენი ინდივიდუალური გეგმა გამოჩნდება აქ პარამეტრების შევსების შემდეგ
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
