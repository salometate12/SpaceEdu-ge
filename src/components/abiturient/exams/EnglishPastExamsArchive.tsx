"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarRange, Layers3 } from "lucide-react";
import {
  getEnglishExamYears,
  getEnglishVariant,
  type EnglishExamVariant,
} from "@/data/englishExamsData";
import { EnglishExamSimulation } from "./EnglishExamSimulation";

/** The English equivalent of PastExamsArchive: same year/variant flow, runner
 *  is EnglishExamSimulation and the data is ENGLISH_EXAM_YEARS. */
export function EnglishPastExamsArchive() {
  const years = useMemo(() => getEnglishExamYears(), []);
  const [activeYear, setActiveYear] = useState<number | null>(years[0]?.year ?? null);
  const [runId, setRunId] = useState<string | null>(null);

  const runVariant = runId ? getEnglishVariant(runId) : null;
  const selectedYear = years.find((y) => y.year === activeYear) ?? years[0] ?? null;

  if (runVariant) {
    return <EnglishExamSimulation variant={runVariant} onExit={() => setRunId(null)} />;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/subject/english"
        className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-300/80 bg-white/60 text-slate-600 transition hover:border-slate-500 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-slate-300"
        aria-label="დაბრუნება"
      >
        <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
      </Link>

      <header className="rounded-2xl border-2 border-amber-300/70 bg-amber-100/50 p-6 dark:border-amber-400/25 dark:bg-amber-400/[0.07]">
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-400/70 bg-amber-100/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
          <CalendarRange className="h-3 w-3 stroke-[2.5]" />
          ინგლისური ენა
        </span>
        <h1 className="headline mt-3 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-50">
          ეროვნული გამოცდების არქივი
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          რეალური საგამოცდო ვარიანტები — მოსმენა, კითხვა, ლექსიკა-გრამატიკა და წერითი დავალება.
          იმიტირებული გამოცდა: პასუხები არსად ჩანს დასრულებამდე, ბოლოს კი წერით დავალებას AI აფასებს.
        </p>
      </header>

      {years.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center text-sm text-slate-600 dark:border-white/15 dark:text-slate-300">
          ამ საგნის არქივი ჯერ მზადდება.
        </div>
      ) : (
        <>
          <section className="mt-6">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              აირჩიე წელი
            </p>
            <div className="flex flex-wrap gap-2.5">
              {years.map((entry) => {
                const active = entry.year === selectedYear?.year;
                return (
                  <button
                    key={entry.year}
                    type="button"
                    onClick={() => setActiveYear(entry.year)}
                    className={`rounded-2xl border-2 px-5 py-3 text-lg font-bold transition ${
                      active
                        ? "border-amber-400/70 bg-amber-100/70 text-amber-800 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-200"
                        : "border-slate-300/80 bg-white/55 text-slate-600 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-slate-300"
                    }`}
                  >
                    {entry.year}
                    <span className="ml-2 text-[11px] font-semibold opacity-70">
                      {entry.variants.length} ვარიანტი
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedYear && (
            <section className="mt-8">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {selectedYear.year} — ვარიანტები
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {selectedYear.variants.map((variant: EnglishExamVariant) => {
                  const hours = Math.floor(variant.durationSeconds / 3600);
                  const minutes = Math.round((variant.durationSeconds % 3600) / 60);
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setRunId(variant.id)}
                      className="group rounded-2xl border-2 border-slate-300/80 bg-white/55 p-5 text-left transition hover:-translate-y-1 dark:border-white/[0.12] dark:bg-white/[0.04]"
                    >
                      <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-400/70 bg-amber-100/70 px-3.5 py-1 text-[11px] font-bold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
                        <Layers3 className="h-3 w-3 stroke-[2.5]" />
                        {variant.label}
                      </span>
                      <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-50">
                        {variant.tasks.length} დავალება + წერითი
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        {variant.totalPoints} ქულა · {hours} სთ {minutes} წთ
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                        დაიწყე ტესტი
                        <ArrowRight className="h-3.5 w-3.5 stroke-[2.5] transition group-hover:translate-x-0.5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
