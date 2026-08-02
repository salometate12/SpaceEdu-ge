"use client";

import Link from "next/link";
import { ChevronLeft, Calculator } from "lucide-react";
import { PredictionResult } from "./PredictionResult";
import { UniCalculatorWizard } from "./UniCalculatorWizard";
import { UniRankingsPanel } from "./UniRankingsPanel";

import { DASHBOARD_ABIT_HREF } from "@/lib/dashboard-routes";

const DASHBOARD_HREF = DASHBOARD_ABIT_HREF;

export function ExamCalculatorPage() {
  return (
    <div className="min-h-full bg-[#070913]">
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <Link
          href={DASHBOARD_HREF}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-gray-400 transition-all hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
          დაბრუნება დეშბორდზე
        </Link>

        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
            <Calculator className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              უნივერსიტეტის კალკულატორი
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              შეფასება საგნების ქულებით, პროგნოზი და პროგრამების შერჩევა.
            </p>
          </div>
        </header>

        <UniCalculatorWizard />

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <PredictionResult />
          <UniRankingsPanel />
        </section>
      </main>
    </div>
  );
}
