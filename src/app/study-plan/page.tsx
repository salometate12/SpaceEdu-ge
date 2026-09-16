"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { StudyPlanForm, type StudyPlanFormValues } from "@/components/StudyPlan/StudyPlanForm";
import { CalendarView } from "@/components/StudyPlan/CalendarView";
import { StudyPlanThinkingLoader } from "@/components/StudyPlan/StudyPlanThinkingLoader";
import { ToolPageHeader } from "@/components/layout/ToolPageHeader";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { StudyPlanResponse } from "@/lib/ai/study-plan-schema";

export default function StudyPlanPage() {
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
      <ToolPageHeader
        title="სასწავლო გეგმის გენერატორი"
        subtitle="შეიყვანე საგნის საკითხები და ხელოვნური ინტელექტი დღეებზე გაგიწერს მომზადების გრაფიკს"
      />

      <section className="mt-6 flex w-full flex-col items-stretch gap-6 lg:flex-row">
        <div className="w-full flex-shrink-0 lg:w-[380px]">
          <StudyPlanForm loading={loading} onSubmit={generatePlan} />
          {error && (
            <div className="mt-4 rounded-2xl border border-rose-300/50 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}
        </div>

        <div className="dashboard-tool-card min-h-[500px] flex-1 rounded-[28px] p-6">
          {loading ? (
            <StudyPlanThinkingLoader />
          ) : result ? (
            <CalendarView
              plan={result.plan}
              totalDays={result.total_days}
              advice={result.advice}
              subject={subjectTitle}
              space="student"
            />
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300">
                  <CalendarRange className="h-7 w-7 stroke-[1.75]" aria-hidden />
                </span>
                <p className="max-w-xs text-sm leading-relaxed text-slate-500 dark:text-zinc-500">
                  შენი ინდივიდუალური გეგმა გამოჩნდება აქ — შეავსე მარცხნივ საგანი, თემები და
                  გამოცდის თარიღი და დააჭირე „გეგმის გენერაცია“-ს.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
