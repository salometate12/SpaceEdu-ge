"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Radar, TrendingUp } from "lucide-react";
import {
  CATEGORY_ACCURACY_UPDATED_EVENT,
  getCategoryStats,
  overallAccuracy,
  totalAttempts,
  weakestCategory,
  WEAK_THRESHOLD,
  type CategoryStat,
} from "@/lib/category-accuracy";
import { practiceHrefForCategory } from "@/lib/exam-categories";

/** Rows with no attempts are noise on a first-run dashboard. */
const MAX_ROWS = 6;

export function WeaknessRadar() {
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => {
      setStats(getCategoryStats());
      setHydrated(true);
    };
    sync();
    window.addEventListener(CATEGORY_ACCURACY_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CATEGORY_ACCURACY_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const practised = stats.filter((stat) => stat.total > 0).slice(0, MAX_ROWS);
  const weakest = weakestCategory(stats);
  const attempts = totalAttempts(stats);
  const overall = overallAccuracy(stats);

  return (
    <section className="dashboard-section p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radar className="h-6 w-6 text-cyan-500 dark:text-cyan-400" strokeWidth={1.5} />
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              სუსტი წერტილების რადარი
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              სიზუსტე კატეგორიების მიხედვით — არქივისა და კითხვის მოდულების პასუხებიდან.
            </p>
          </div>
        </div>
        {overall !== null && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-600 dark:text-cyan-300">
            <TrendingUp className="h-3.5 w-3.5 stroke-[2]" />
            {overall}% საშუალო
          </span>
        )}
      </div>

      {!hydrated ? null : practised.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white/60 p-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            ჯერ არ არის საკმარისი მონაცემი.
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
            ამოხსენი ერთი ვარიანტი არქივიდან — რადარი მაშინვე აჩვენებს, რომელი
            კატეგორია გჭირდება გასავარჯიშებლად.
          </p>
          <Link
            href="/subject/georgian/past-exams"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-cyan-500 px-4 py-2 text-xs font-bold text-[#04141a] transition hover:bg-cyan-400"
          >
            გახსენი არქივი
            <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {practised.map((stat) => {
              const accuracy = stat.accuracy ?? 0;
              const weak = accuracy < WEAK_THRESHOLD;
              return (
                <li key={stat.category}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                      {stat.label}
                    </span>
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: weak ? "#fb7185" : "#34d399" }}
                    >
                      {accuracy}%
                      <span className="ml-1.5 text-[11px] font-medium text-slate-400 dark:text-zinc-600">
                        {stat.correct}/{stat.total}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/[0.06]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: weak ? "#fb7185" : stat.accent }}
                      initial={{ width: 0 }}
                      animate={{ width: `${accuracy}%` }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-400/20 dark:bg-rose-500/[0.06]">
            {weakest ? (
              <>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  ყველაზე სუსტი: {weakest.label} — {weakest.accuracy}%
                </p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-zinc-400">
                  {weakest.hint}
                </p>
                <Link
                  href={practiceHrefForCategory(weakest.category)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-400"
                >
                  გაავარჯიშე სუსტი წერტილი
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  სუსტი წერტილი ჯერ არ იკვეთება.
                </p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-zinc-400">
                  {attempts} პასუხი დაფიქსირდა. გააგრძელე — რადარი მაშინ მიუთითებს
                  კატეგორიაზე, როცა სიზუსტე {WEAK_THRESHOLD}%-ს ჩამოსცდება.
                </p>
                <Link
                  href="/subject/georgian/past-exams"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200"
                >
                  გაავარჯიშე სუსტი წერტილი
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
