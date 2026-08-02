"use client";

import Link from "next/link";
import { GitMerge } from "lucide-react";
import { LIT_PARALLELS_HREF } from "@/lib/georgian-lit-parallels-table";

const COMPACT_CARD_CLASS =
  "group relative block cursor-pointer overflow-hidden rounded-2xl border border-white/[0.06] bg-[#121214]/40 p-6 backdrop-blur-md transition-all duration-300 hover:border-purple-500/30";

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
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-purple-500/25 opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-90"
        aria-hidden
      />
      <div className="relative z-[1] flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10">
        <GitMerge className="h-5 w-5 stroke-[1.5] text-purple-400" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-white">ლიტერატურული პარალელები</h2>
      <p className="mt-1 text-xs leading-relaxed text-gray-400">
        ინტერაქტიული მატრიცა — ნაწარმოები, თემები, პარალელები და თანამედროვე არგუმენტები.
      </p>
      <p className="mt-5 text-xs font-medium text-purple-400 transition-colors group-hover:text-purple-300">
        გახსნა →
      </p>
    </Link>
  );
}
