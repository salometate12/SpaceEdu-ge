"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { StudyPlanForm, type StudyPlanFormValues } from "@/components/StudyPlan/StudyPlanForm";
import { CalendarView } from "@/components/StudyPlan/CalendarView";
import { StudyPlanThinkingLoader } from "@/components/StudyPlan/StudyPlanThinkingLoader";
import { ToolPageHeader } from "@/components/layout/ToolPageHeader";
import { studyPlanCardClass } from "@/components/StudyPlan/study-plan-styles";
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
        tone="neutral"
      />

      <section className="flex w-full flex-col items-stretch gap-5 lg:flex-row lg:gap-6">
        <div className="w-full flex-shrink-0 lg:w-[380px]">
          <StudyPlanForm loading={loading} onSubmit={generatePlan} />
          {error && (
            <div className="mt-4 rounded-2xl border border-rose-300/50 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}
        </div>

        {/* Empty, the result area is a dashed outline that ends level with
            the form on desktop; with a plan it becomes a plain card. */}
        <div
          className={`min-w-0 flex-1 ${
            loading || result
              ? studyPlanCardClass
              : "flex rounded-2xl border border-dashed border-[var(--border-hover)] bg-[var(--bg-card)] p-5 dark:border-white/15 sm:p-6"
          }`}
        >
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
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-[var(--accent-primary)] dark:bg-pink-400/10 dark:text-pink-300">
                <CalendarRange className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
              <p className="max-w-[360px] text-sm leading-relaxed text-[var(--text-secondary)]">
                შენი ინდივიდუალური გეგმა გამოჩნდება აქ — შეავსე მარცხნივ საგანი, თემები და
                გამოცდის თარიღი და დააჭირე „გეგმის გენერაცია“-ს.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
