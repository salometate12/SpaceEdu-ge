"use client";

import dynamic from "next/dynamic";

/**
 * The practice page draws its topic at random on the very first render.
 * That can only be honest if the server never renders it — otherwise the
 * markup and the hydration would disagree about which topic came up. So
 * the component is loaded on the client only, with a placeholder holding
 * its place meanwhile.
 */
const EssayTopicPractice = dynamic(
  () =>
    import("./EssayTopicPractice").then((mod) => ({
      default: mod.EssayTopicPractice,
    })),
  {
    ssr: false,
    loading: () => (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="h-40 animate-pulse rounded-2xl border-2 border-slate-300/80 bg-white/55 dark:border-white/[0.12] dark:bg-white/[0.04]" />
        <div className="mt-4 h-80 animate-pulse rounded-2xl border-2 border-slate-300/80 bg-white/55 dark:border-white/[0.12] dark:bg-white/[0.04]" />
      </main>
    ),
  },
);

export function EssayTopicPracticeLoader() {
  return <EssayTopicPractice />;
}
