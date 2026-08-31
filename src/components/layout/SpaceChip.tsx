"use client";

import Link from "next/link";
import { GraduationCap, School, University } from "lucide-react";

type SpaceKind = "school" | "abiturient" | "student";

const SPACE_STYLE: Record<
  SpaceKind,
  {
    label: string;
    icon: React.ReactNode;
    bg?: string;
    border?: string;
    color?: string;
    className?: string;
  }
> = {
  school: {
    label: "სკოლა",
    bg: "#1a0a2e",
    border: "#7C3AED",
    color: "#c4b5fd",
    icon: <School className="h-3.5 w-3.5" />,
  },
  abiturient: {
    label: "აბიტურიენტი",
    bg: "#042f3d",
    border: "#22d3ee",
    color: "#67e8f9",
    icon: <GraduationCap className="h-3.5 w-3.5" />,
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

  if (ui.className) {
    return (
      <Link
        href="/select-space"
        className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all hover:-translate-y-0.5 ${ui.className}`}
      >
        {ui.icon}
        {ui.label}
      </Link>
    );
  }

  return (
    <Link
      href="/select-space"
      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-transform hover:-translate-y-0.5"
      style={{ background: ui.bg, borderColor: ui.border, color: ui.color }}
    >
      {ui.icon}
      {ui.label}
    </Link>
  );
}

