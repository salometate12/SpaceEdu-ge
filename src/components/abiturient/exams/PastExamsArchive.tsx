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
import { subjectAccent } from "@/lib/subject-accents";
import { Pencil, Ruler, Sparkle } from "@/components/landing/notebook/Doodles";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_TEXT,
  PLAIN_CARD,
} from "@/components/landing/notebook/accents";
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
  const accent = subjectAccent(subjectId);
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
            accent={accent}
            year={run.year}
            variant={run.variant}
            onExit={() => setRun(null)}
          />
        ) : (
          <PastExamRunner
            subjectId={subjectId}
            subjectTitle={subjectTitle}
            accent={accent}
            year={run.year}
            variant={run.variant}
            onExit={() => setRun(null)}
          />
        )}
      </main>
    );
  }

  return (
    <main className="relative mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Sparkle
        className={`pointer-events-none absolute right-6 top-8 hidden h-4 w-4 -rotate-12 opacity-70 lg:block ${ACCENT_TEXT[accent]}`}
      />
      <Ruler className="pointer-events-none absolute -left-4 top-48 hidden w-20 -rotate-12 text-slate-400 opacity-60 xl:block dark:text-slate-500" />
      <Pencil className="pointer-events-none absolute -right-4 bottom-24 hidden h-11 w-11 rotate-12 text-amber-600/50 xl:block dark:text-amber-400/40" />

      <Link
        href={subjectId === "georgian" ? "/subject/georgian" : `/subject/${subjectId}`}
        className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-300/80 bg-white/60 text-slate-600 transition-colors hover:border-slate-500 hover:text-slate-900 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
        aria-label="დაბრუნება"
      >
        <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
      </Link>

      <header className={`rounded-2xl border-2 p-6 ${ACCENT_CARD[accent]}`}>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${ACCENT_PILL[accent]}`}
        >
          <CalendarRange className="h-3 w-3 stroke-[2.5]" aria-hidden />
          {subjectTitle}
        </span>
        <h1 className="headline mt-3 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-50">
          ეროვნული გამოცდების არქივი
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          ტესტები წლებისა და ვარიანტების მიხედვით. ყველა ვარიანტი იხსნება SpaceEdu-ს
          ინტერაქციულ რეჟიმში — ტექსტი მარცხნივ, კითხვები მარჯვნივ, მყისიერი შემოწმებით
          და ახსნებით.
        </p>
      </header>

      {years.length === 0 ? (
        <div className={`mt-6 rounded-2xl border-2 p-10 text-center ${PLAIN_CARD}`}>
          <FileQuestion
            className="mx-auto h-10 w-10 stroke-[1.75] text-slate-400 dark:text-slate-500"
            aria-hidden
          />
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            ამ საგნის არქივი ჯერ მზადდება.
          </p>
          <Link
            href="/subject/georgian/past-exams"
            className={`mt-4 inline-flex items-center gap-1.5 text-sm font-bold ${ACCENT_TEXT[accent]}`}
          >
            ნახე ქართულის არქივი
            <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </Link>
        </div>
      ) : (
        <>
          {/* ------------------------- year selector ------------------------ */}
          <section className="mt-6" aria-label="წლის არჩევა">
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
                    className={`rounded-2xl border-2 px-5 py-3 text-lg font-bold transition-transform ${
                      active ? `paper-sticker ${ACCENT_PILL[accent]}` : PLAIN_CARD
                    } ${active ? "" : "text-slate-600 dark:text-slate-300"}`}
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

          {/* ------------------------ variant grid -------------------------- */}
          {selectedYear && (
            <section className="mt-8" aria-label="ვარიანტები">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                    className={`group rounded-2xl border-2 p-5 text-left transition-transform duration-300 hover:-translate-y-1 ${PLAIN_CARD}`}
                  >
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1 text-[11px] font-bold ${ACCENT_PILL[accent]}`}
                    >
                      <Layers3 className="h-3 w-3 stroke-[2.5]" aria-hidden />
                      {variant.label}
                    </span>
                    <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-50">
                      {variant.blurb}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {countVariantQuestions(variant)} კითხვა ·{" "}
                      {variant.passages.length} ტექსტი
                    </p>
                    <span className={`mt-4 inline-flex items-center gap-1.5 text-xs font-bold ${ACCENT_TEXT[accent]}`}>
                      დაიწყე ტესტი
                      <ArrowRight className="h-3.5 w-3.5 stroke-[2.5] transition-transform group-hover:translate-x-0.5" />
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
