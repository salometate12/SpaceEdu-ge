"use client";

import Link from "next/link";
import { GraduationCap, School, University } from "lucide-react";

type SpaceKind = "school" | "abiturient" | "student";

const SPACE_STYLE: Record<
  SpaceKind,
  { label: string; bg: string; border: string; color: string; icon: React.ReactNode }
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
    bg: "#042f3d",
    border: "#22d3ee",
    color: "#67e8f9",
    icon: <University className="h-3.5 w-3.5" />,
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
      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-transform hover:-translate-y-0.5"
      style={{ background: ui.bg, borderColor: ui.border, color: ui.color }}
    >
      {ui.icon}
      {ui.label}
    </Link>
  );
}

