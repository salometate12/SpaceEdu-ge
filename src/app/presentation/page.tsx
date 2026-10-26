import { Suspense } from "react";
import Link from "next/link";
import { Noto_Serif_Georgian } from "next/font/google";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ToolPageHeader } from "@/components/layout/ToolPageHeader";
import { PresentationApp } from "@/components/presentation/PresentationApp";

/** Paper's slide titles (the sans font is the site's own). */
const notoSerifGeorgian = Noto_Serif_Georgian({
  variable: "--font-noto-serif-georgian",
  subsets: ["georgian", "latin"],
  weight: ["600", "700"],
});

export default function PresentationPage() {
  return (
    <main className={`${notoSerifGeorgian.variable} mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8`}>
      {/* Phones: a short header — back, „პრეზენტაციები“, one line under it. */}
      <div className="flex items-center gap-3 md:hidden">
        <Link
          href="/dashboard-student"
          aria-label="უკან"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e7e5e4] bg-white text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/30 dark:border-[#2e2e38] dark:bg-[#15151b] dark:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        </Link>
        <div className="min-w-0">
          <h1 className="headline text-[21px] font-bold leading-tight text-slate-900 dark:text-zinc-100">პრეზენტაციები</h1>
          <p className="truncate text-[13px] text-slate-500 dark:text-zinc-400">თემა მიეცი — AI სლაიდებს მოგიმზადებს</p>
        </div>
      </div>
      <div className="hidden md:block">
        <ToolPageHeader
          title="პრეზენტაციების გენერატორი"
          subtitle="მიუთითე თემა და AI წამებში მოგიმზადებს სრულყოფილ სლაიდების სტრუქტურასა და ტექსტებს"
        />
      </div>
      {/* ?id= is read on the client; the header above still prerenders. */}
      <Suspense
        fallback={
          <div className="flex min-h-[30vh] items-center justify-center text-slate-500 dark:text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        }
      >
        <PresentationApp />
      </Suspense>
    </main>
  );
}
