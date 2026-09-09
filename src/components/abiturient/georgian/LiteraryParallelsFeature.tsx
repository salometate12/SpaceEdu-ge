"use client";

import Link from "next/link";
import { ArrowRight, GitMerge } from "lucide-react";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_TEXT,
} from "@/components/landing/notebook/accents";
import { LIT_PARALLELS_HREF } from "@/lib/georgian-lit-parallels-table";

const COMPACT_CARD_CLASS = `group block rounded-2xl border-2 p-6 transition-transform duration-300 hover:-translate-y-1 ${ACCENT_CARD.violet}`;

export function LiteraryParallelsCompactCard({
  className = "",
  backContext = "space",
}: {
  className?: string;
  /** Reserved for future contextual back links on the table page */
  backContext?: "space" | "hub";
}) {
  void backContext;

  const href =
    backContext === "hub"
      ? `${LIT_PARALLELS_HREF}?from=hub`
      : `${LIT_PARALLELS_HREF}?from=space`;

  return (
    <Link href={href} className={`${COMPACT_CARD_CLASS} ${className}`}>
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${ACCENT_CARD.violet} ${ACCENT_TEXT.violet}`}
      >
        <GitMerge className="h-5 w-5 stroke-[2]" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-50">
        ლიტერატურული პარალელები
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
        ინტერაქტიული მატრიცა — ნაწარმოები, თემები, პარალელები და თანამედროვე არგუმენტები.
      </p>
      <span
        className={`mt-5 inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-xs font-bold ${ACCENT_PILL.violet}`}
      >
        გახსნა
        <ArrowRight className="h-3.5 w-3.5 stroke-[2.5] transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
