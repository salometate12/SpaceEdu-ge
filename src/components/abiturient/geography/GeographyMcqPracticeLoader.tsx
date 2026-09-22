"use client";

import dynamic from "next/dynamic";

/** Client-only so the random question drawn on first render can't cause a
 *  hydration mismatch. */
const GeographyMcqPractice = dynamic(
  () => import("./GeographyMcqPractice").then((mod) => ({ default: mod.GeographyMcqPractice })),
  {
    ssr: false,
    loading: () => (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="h-72 animate-pulse rounded-2xl border-2 border-slate-300/80 bg-white/55 dark:border-white/[0.12] dark:bg-white/[0.04]" />
      </main>
    ),
  },
);

export function GeographyMcqPracticeLoader() {
  return <GeographyMcqPractice />;
}
