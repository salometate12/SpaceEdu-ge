"use client";

import Link from "next/link";
import { BookOpen, Clock, GraduationCap, Rocket, Target } from "lucide-react";
import { motion } from "framer-motion";
import {
  DASHBOARD_ABIT_HREF,
  DASHBOARD_SCHOOL_HREF,
  DASHBOARD_STUDENT_HREF,
} from "@/lib/dashboard-routes";
import { SpaceCard, type SpaceOption } from "./SpaceCard";

interface SpaceSelectorModalProps {
  onSelect: (id: SpaceOption["id"]) => void;
}

const SPACES: SpaceOption[] = [
  {
    id: "school",
    title: "სკოლა",
    description: "9–12 კლასი, საგნობრივი დახმარება და AI მასწავლებელი",
    available: false,
    badge: "მალე დაემატება",
    route: DASHBOARD_SCHOOL_HREF,
    borderColor: "#7C3AED",
    bgColor: "#1a0a2e",
    accentColor: "#a78bfa",
    icon: <GraduationCap className="h-7 w-7 stroke-[1.5]" />,
    badgeIcon: Clock,
  },
  {
    id: "abiturient",
    title: "აბიტურიენტი",
    description: "ეროვნული გამოცდები, 2026 პროგრამა და Mock exam",
    available: true,
    badge: "ხელმისაწვდომია",
    route: DASHBOARD_ABIT_HREF,
    borderColor: "#22d3ee",
    bgColor: "#042f3d",
    accentColor: "#22d3ee",
    icon: <Target className="h-7 w-7 stroke-[1.5]" />,
  },
  {
    id: "student",
    title: "სტუდენტი",
    description: "უნივერსიტეტის კურსები, კვლევა და AI პრეზენტაცია",
    available: true,
    badge: "ხელმისაწვდომია",
    route: DASHBOARD_STUDENT_HREF,
    borderColor: "#22c55e",
    bgColor: "#052e16",
    accentColor: "#86efac",
    icon: <BookOpen className="h-7 w-7 stroke-[1.5]" />,
  },
];

export function SpaceSelectorModal({ onSelect }: SpaceSelectorModalProps) {
  return (
    <section className="fade-in relative flex min-h-dvh w-full items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_62%_48%_at_4%_0%,rgba(16,185,129,0.11),transparent_55%),radial-gradient(ellipse_58%_44%_at_97%_0%,rgba(6,182,212,0.11),transparent_52%),radial-gradient(ellipse_62%_46%_at_100%_100%,rgba(124,58,237,0.1),transparent_55%),radial-gradient(ellipse_55%_40%_at_0%_100%,rgba(16,185,129,0.07),transparent_52%)]" />
      <div className="relative z-10 w-full max-w-6xl">
        <div className="stagger-in mb-9 text-center" style={{ animationDelay: "120ms" }}>
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 shadow-[0_0_16px_rgba(124,58,237,0.4)] transition-transform duration-300 hover:scale-105">
              <Rocket className="h-[18px] w-[18px] text-white" />
            </div>
            <span className="headline animate-gradient-text bg-gradient-to-r from-violet-300 via-indigo-300 to-cyan-300 bg-clip-text text-lg font-bold tracking-wide text-transparent">
              SpaceEdu
            </span>
          </div>

          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/[0.06] px-4 py-1.5 text-xs font-medium text-purple-300">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" aria-hidden />
            დაიწყე მოგზაურობა
          </span>

          <h1 className="headline mb-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            აირჩიე შენი{" "}
            <span className="bg-gradient-to-r from-[#c084fc] to-[#22d3ee] bg-clip-text text-transparent">
              სივრცე
            </span>
          </h1>
          <p className="text-sm tracking-wide text-[var(--text-secondary)] sm:text-base">
            სწავლის გამოცდილება მორგებული შენს საჭიროებებზე
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {SPACES.map((space, idx) => (
            <SpaceCard
              key={space.id}
              space={space}
              animationDelayMs={170 + idx * 90}
              onClick={() => space.available && onSelect(space.id)}
            />
          ))}
        </motion.div>

        <p
          className="stagger-in text-center text-xs tracking-wide text-[var(--text-secondary)]"
          style={{ animationDelay: "420ms" }}
        >
          უკვე გაქვს ანგარიში?{" "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300">
            შესვლა
          </Link>
        </p>
      </div>
    </section>
  );
}
