"use client";

import Link from "next/link";
import { Building2, GraduationCap, School } from "lucide-react";
import type { RegisterSpace } from "@/lib/auth";

const spaceConfig: Record<
  RegisterSpace,
  {
    label: string;
    bg: string;
    border: string;
    color: string;
    icon: React.ReactNode;
  }
> = {
  school: {
    label: "სკოლა — 9-12 კლასი",
    bg: "#1a0a2e",
    border: "#7C3AED",
    color: "#a78bfa",
    icon: <School className="h-4 w-4" />,
  },
  abiturient: {
    label: "აბიტურიენტი — ეროვნულები 2026",
    bg: "#042f3d",
    border: "#22d3ee",
    color: "#22d3ee",
    icon: <GraduationCap className="h-4 w-4" />,
  },
  student: {
    label: "სტუდენტი — უნივერსიტეტი",
    bg: "#052e16",
    border: "#22c55e",
    color: "#22c55e",
    icon: <Building2 className="h-4 w-4" />,
  },
};

interface SpaceIndicatorProps {
  space: RegisterSpace;
}

export function SpaceIndicator({ space }: SpaceIndicatorProps) {
  const cfg = spaceConfig[space];
  return (
    <div
      className="mb-4 flex items-center justify-between rounded-xl border px-3 py-2"
      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
    >
      <div className="inline-flex items-center gap-2 text-xs font-semibold">
        {cfg.icon}
        {cfg.label}
      </div>
      <Link href="/select-space" className="text-xs opacity-90 hover:opacity-100">
        შეცვლა ↗
      </Link>
    </div>
  );
}

