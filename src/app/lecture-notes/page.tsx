import { Suspense } from "react";
import type { Metadata } from "next";
import { LectureNotesPage } from "@/components/lecture-notes/LectureNotesPage";

export const metadata: Metadata = {
  title: "AI Lecture Notes",
  description: "ლექციის ნოტები: ცოცხალი ჩანაწერი, AI საკვანძო თემები და დეშბორდის სტიკერი.",
};

export default function LectureNotesRoute() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <Suspense
        fallback={
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-white/10 dark:bg-[#121214] dark:text-zinc-400">
            ნოტები იტვირთება...
          </div>
        }
      >
        <LectureNotesPage />
      </Suspense>
    </main>
  );
}
