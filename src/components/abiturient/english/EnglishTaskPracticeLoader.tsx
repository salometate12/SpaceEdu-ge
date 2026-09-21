"use client";

import dynamic from "next/dynamic";

/**
 * The practice page draws its task at random on the very first render. That can
 * only be honest if the server never renders it — otherwise the markup and the
 * hydration would disagree about which task came up. So the component is loaded
 * on the client only, with a placeholder holding its place.
 */
const EnglishTaskPractice = dynamic(
  () => import("./EnglishTaskPractice").then((mod) => ({ default: mod.EnglishTaskPractice })),
  {
    ssr: false,
    loading: () => (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="h-72 animate-pulse rounded-2xl border-2 border-slate-300/80 bg-white/55 dark:border-white/[0.12] dark:bg-white/[0.04]" />
      </main>
    ),
  },
);

export function EnglishTaskPracticeLoader() {
  return <EnglishTaskPractice />;
}
