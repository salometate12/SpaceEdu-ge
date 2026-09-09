"use client";

import Link from "next/link";
import { GraduationCap, School, University } from "lucide-react";

type SpaceKind = "school" | "abiturient" | "student";

const SPACE_STYLE: Record<
  SpaceKind,
  {
    label: string;
    icon: React.ReactNode;
    className: string;
  }
> = {
  school: {
    label: "სკოლა",
    icon: <School className="h-3.5 w-3.5" />,
    className:
      "border-violet-300 bg-violet-100 text-violet-700 hover:bg-violet-200/70 dark:border-[#7C3AED] dark:bg-[#1a0a2e] dark:text-[#c4b5fd] dark:hover:bg-[#1a0a2e]/80",
  },
  abiturient: {
    label: "აბიტურიენტი",
    icon: <GraduationCap className="h-3.5 w-3.5" />,
    className:
      "border-cyan-300 bg-cyan-100 text-cyan-700 hover:bg-cyan-200/70 dark:border-[#22d3ee] dark:bg-[#042f3d] dark:text-[#67e8f9] dark:hover:bg-[#042f3d]/80",
  },
  student: {
    label: "სტუდენტი",
    icon: <University className="h-3.5 w-3.5" />,
    className:
      "border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200/70 dark:border-amber-400/35 dark:bg-amber-400/10 dark:text-amber-300 dark:hover:bg-amber-400/15",
  },
};

interface SpaceChipProps {
  space: SpaceKind;
}

export function SpaceChip({ space }: SpaceChipProps) {
  const ui = SPACE_STYLE[space];

  return (
    <Link
      href="/select-space"
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border-2 px-2 py-1 text-[11px] font-bold transition-all hover:-translate-y-0.5 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs ${ui.className}`}
    >
      {ui.icon}
      {ui.label}
    </Link>
  );
}

