"use client";

import Link from "next/link";
import { ArrowRight, Layers, Sparkles } from "lucide-react";

const GEORGIAN_SPACE_HREF = "/subject/georgian/space";

export function GeorgianSpacePremiumCard() {
  return (
    <Link
      href={GEORGIAN_SPACE_HREF}
      className="group relative block cursor-pointer overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-600/[0.08] to-indigo-600/[0.03] p-6 shadow-[0_0_30px_rgba(139,92,246,0.05)] backdrop-blur-xl transition-all hover:border-purple-500/40"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl transition-opacity group-hover:opacity-100"
        aria-hidden
      />

      <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-purple-500/25 bg-purple-500/10">
            <div
              className="pointer-events-none absolute inset-0 rounded-xl bg-purple-500/30 blur-xl"
              aria-hidden
            />
            <Sparkles className="relative h-6 w-6 stroke-[1.5] text-violet-300" />
          </div>
          <div className="min-w-0">
            <p className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-purple-300/80">
              <Layers className="h-3 w-3 stroke-[1.5]" />
              Premium Space
            </p>
            <h2 className="text-lg font-semibold leading-snug text-white">
              მოემზადე ეროვნულებისთვის შენს Space-ზე
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
              გახსენი ტექსტის რედაქტირების, ანალიტიკური თემების წერისა და გრამატიკის
              ინტერაქტიული AI პანელი.
            </p>
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-medium text-purple-200 transition-all group-hover:border-purple-400/50 group-hover:bg-purple-500/20 sm:self-center">
          გადასვლა
          <ArrowRight className="h-4 w-4 stroke-[1.5] transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export { GEORGIAN_SPACE_HREF };
