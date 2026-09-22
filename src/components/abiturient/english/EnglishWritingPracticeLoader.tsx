"use client";

import dynamic from "next/dynamic";

/** Client-only so the random essay prompt is drawn without a hydration mismatch. */
const EnglishWritingPractice = dynamic(
  () => import("./EnglishWritingPractice").then((mod) => ({ default: mod.EnglishWritingPractice })),
  {
    ssr: false,
    loading: () => (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="h-52 animate-pulse rounded-2xl border-2 border-slate-300/80 bg-white/55 dark:border-white/[0.12] dark:bg-white/[0.04]" />
        <div className="mt-4 h-64 animate-pulse rounded-2xl border-2 border-slate-300/80 bg-white/55 dark:border-white/[0.12] dark:bg-white/[0.04]" />
      </main>
    ),
  },
);

export function EnglishWritingPracticeLoader() {
  return <EnglishWritingPractice />;
}
