"use client";

import dynamic from "next/dynamic";

/** Client-only so the random draw on first render can't cause a hydration mismatch. */
const GeographyOpenPractice = dynamic(
  () => import("./GeographyOpenPractice").then((mod) => ({ default: mod.GeographyOpenPractice })),
  {
    ssr: false,
    loading: () => (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="h-52 animate-pulse rounded-2xl border-2 border-slate-300/80 bg-white/55 dark:border-white/[0.12] dark:bg-white/[0.04]" />
        <div className="mt-4 h-56 animate-pulse rounded-2xl border-2 border-slate-300/80 bg-white/55 dark:border-white/[0.12] dark:bg-white/[0.04]" />
      </main>
    ),
  },
);

export function GeographyOpenPracticeLoader() {
  return <GeographyOpenPractice />;
}
