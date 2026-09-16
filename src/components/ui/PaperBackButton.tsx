"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * The back control for the two paper pages (/about, /contact). They render
 * under the marketing header, which has no back arrow of its own, so this
 * gives readers a way out — back to wherever they came from, or home if the
 * page was opened directly.
 */
export function PaperBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="უკან"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white/70 text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
    >
      <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
    </button>
  );
}
