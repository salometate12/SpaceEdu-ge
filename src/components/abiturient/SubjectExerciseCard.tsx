"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_SOLID,
  ACCENT_TEXT,
  type NotebookAccent,
} from "@/components/landing/notebook/accents";

export interface SubjectExerciseCardProps {
  title: string;
  badgeText: string;
  description: string;
  icon: ReactNode;
  btnText: string;
  href: string;
  accent: NotebookAccent;
  tilt: string;
  /** A doodle tucked into the card's own corner. */
  corner: ReactNode;
}

/** The exam-format exercise card used by every subject's Space hub — the same
 *  shape as the Georgian hub, so maths and history read as the same hand. */
export function SubjectExerciseCard({
  title,
  badgeText,
  description,
  icon,
  btnText,
  href,
  accent,
  tilt,
  corner,
}: SubjectExerciseCardProps) {
  return (
    <article
      className={`group relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-2xl border-2 p-6 transition-transform duration-300 ${tilt} ${ACCENT_CARD[accent]}`}
    >
      <span className="pointer-events-none absolute -right-2 -top-2 opacity-60" aria-hidden>
        {corner}
      </span>

      <div className="relative">
        <span
          className={`inline-flex rounded-full border-2 px-3.5 py-1 text-[11px] font-bold ${ACCENT_PILL[accent]}`}
        >
          {badgeText}
        </span>
        <h2 className="headline mt-3 text-xl font-bold text-slate-900 dark:text-slate-50">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {description}
        </p>
      </div>

      <div className="relative flex flex-1 items-center justify-center py-8">
        <span
          className={`flex h-24 w-24 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${ACCENT_CARD[accent]} ${ACCENT_TEXT[accent]}`}
        >
          {icon}
        </span>
      </div>

      <Link
        href={href}
        className={`paper-sticker relative flex w-full items-center justify-center gap-2 rounded-full border-2 py-3 text-sm font-bold ${ACCENT_SOLID[accent]}`}
      >
        {btnText}
        <ArrowRight className="h-4 w-4 stroke-[2.5] transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </article>
  );
}
