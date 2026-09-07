"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarRange, FileQuestion, Layers3 } from "lucide-react";
import {
  countVariantQuestions,
  getExamYears,
  type ExamVariant,
} from "@/data/pastExamsData";
import { getSubjectHub } from "@/lib/abiturient-subject-hub";
import { ExamSimulation } from "./ExamSimulation";
import { PastExamRunner } from "./PastExamRunner";

interface PastExamsArchiveProps {
  subjectId: string;
}

interface ActiveRun {
  year: number;
  variant: ExamVariant;
}

export function PastExamsArchive({ subjectId }: PastExamsArchiveProps) {
  const subject = getSubjectHub(subjectId);
  const years = useMemo(() => getExamYears(subjectId), [subjectId]);
  const [activeYear, setActiveYear] = useState<number | null>(years[0]?.year ?? null);
  const [run, setRun] = useState<ActiveRun | null>(null);

  const subjectTitle = subject?.title ?? "საგანი";
  const selectedYear = years.find((entry) => entry.year === activeYear) ?? years[0] ?? null;

  if (run) {
    // Real papers (Part I + a two-text choice) run as a timed simulation;
    // the older seed variants keep the plain question runner.
    const simulated = Boolean(run.variant.editingTask && run.variant.choosePassage);
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {simulated ? (
          <ExamSimulation
            subjectTitle={subjectTitle}
            year={run.year}
            variant={run.variant}
            onExit={() => setRun(null)}
          />
        ) : (
          <PastExamRunner
            subjectId={subjectId}
            subjectTitle={subjectTitle}
            year={run.year}
            variant={run.variant}
            onExit={() => setRun(null)}
          />
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href={subjectId === "georgian" ? "/subject/georgian" : `/subject/${subjectId}`}
        className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-slate-500 transition hover:border-cyan-400/50 hover:text-slate-900 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:text-white"
        aria-label="დაბრუნება"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <header className="rounded-[30px] border border-slate-200/90 bg-white/85 p-6 shadow-[0_10px_40px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/[0.09] dark:bg-[#101016]/75 dark:shadow-none">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/70 bg-cyan-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:border-cyan-400/25 dark:bg-cyan-500/10 dark:text-cyan-300">
          <CalendarRange className="h-3 w-3 stroke-[2]" />
          {subjectTitle}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
          ეროვნული გამოცდების არქივი
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
          ტესტები წლებისა და ვარიანტების მიხედვით. ყველა ვარიანტი იხსნება SpaceEdu-ს
          ინტერაქციულ რეჟიმში — ტექსტი მარცხნივ, კითხვები მარჯვნივ, მყისიერი შემოწმებით
          და ახსნებით.
        </p>
      </header>

      {years.length === 0 ? (
        <div className="mt-6 rounded-[30px] border border-slate-200/90 bg-white/80 p-10 text-center backdrop-blur-xl dark:border-white/10 dark:bg-[#101016]/60">
          <FileQuestion className="mx-auto h-10 w-10 text-slate-300 dark:text-zinc-600" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-slate-600 dark:text-zinc-400">
            ამ საგნის არქივი ჯერ მზადდება.
          </p>
          <Link
            href="/subject/georgian/past-exams"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
          >
            ნახე ქართულის არქივი
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <>
          {/* ------------------------- year selector ------------------------ */}
          <section className="mt-6" aria-label="წლის არჩევა">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
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
                    className={`rounded-xl border px-5 py-3 text-lg font-bold transition-all ${
                      active
                        ? "border-cyan-400/70 bg-cyan-50 text-cyan-800 shadow-[0_6px_22px_-10px_rgba(6,182,212,0.5)] dark:bg-cyan-500/12 dark:text-white"
                        : "border-slate-200 bg-white/60 text-slate-500 hover:border-slate-300 hover:text-slate-900 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-zinc-400 dark:hover:border-white/20 dark:hover:text-white"
                    }`}
                  >
                    {entry.year}
                    <span className="ml-2 text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                      {entry.variants.length} ვარიანტი
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ------------------------ variant grid -------------------------- */}
          {selectedYear && (
            <section className="mt-8" aria-label="ვარიანტები">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {selectedYear.year} — ვარიანტები
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {selectedYear.variants.map((variant, variantIndex) => (
                  <motion.button
                    key={variant.id}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: variantIndex * 0.06, duration: 0.3 }}
                    onClick={() => setRun({ year: selectedYear.year, variant })}
                    className="group relative overflow-hidden rounded-[26px] border border-slate-200/90 bg-white/85 p-5 text-left shadow-[0_10px_40px_-28px_rgba(15,23,42,0.4)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-cyan-400/50 dark:border-white/[0.09] dark:bg-[#101016]/75 dark:shadow-none dark:hover:border-cyan-400/40"
                  >
                    <div
                      className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full opacity-[0.08] blur-2xl transition-opacity group-hover:opacity-[0.16]"
                      style={{
                        background: "radial-gradient(circle, #06B6D4 0%, transparent 70%)",
                      }}
                      aria-hidden
                    />
                    <span className="relative z-[1] inline-flex items-center gap-1.5 rounded-full border-2 border-cyan-300/70 bg-cyan-50 px-3.5 py-1 text-[11px] font-bold text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/[0.06] dark:text-cyan-300">
                      <Layers3 className="h-3 w-3 stroke-[2]" />
                      {variant.label}
                    </span>
                    <h3 className="relative z-[1] mt-3 text-base font-semibold text-slate-900 dark:text-white">
                      {variant.blurb}
                    </h3>
                    <p className="relative z-[1] mt-1 text-xs text-slate-500 dark:text-zinc-500">
                      {countVariantQuestions(variant)} კითხვა ·{" "}
                      {variant.passages.length} ტექსტი
                    </p>
                    <span className="relative z-[1] mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                      დაიწყე ტესტი
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </motion.button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
