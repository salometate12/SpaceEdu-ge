"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Clock, GraduationCap, Rocket, Target } from "lucide-react";
import {
  DASHBOARD_ABIT_HREF,
  DASHBOARD_SCHOOL_HREF,
  DASHBOARD_STUDENT_HREF,
} from "@/lib/dashboard-routes";
import {
  Flower,
  Pencil,
  RainbowArc,
  Ruler,
  Sparkle,
  Sun,
} from "@/components/landing/notebook/Doodles";
import { ACCENT_PILL, ACCENT_TEXT } from "@/components/landing/notebook/accents";
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
    accent: "violet",
    tilt: "hover:-rotate-1",
    icon: <GraduationCap className="h-6 w-6 stroke-[2]" />,
    badgeIcon: Clock,
  },
  {
    id: "abiturient",
    title: "აბიტურიენტი",
    description: "ეროვნული გამოცდები, 2026 პროგრამა და Mock exam",
    available: true,
    badge: "ხელმისაწვდომია",
    route: DASHBOARD_ABIT_HREF,
    accent: "blue",
    tilt: "hover:rotate-1",
    icon: <Target className="h-6 w-6 stroke-[2]" />,
  },
  {
    id: "student",
    title: "სტუდენტი",
    description: "უნივერსიტეტის კურსები, კვლევა და AI პრეზენტაცია",
    available: true,
    badge: "ხელმისაწვდომია",
    route: DASHBOARD_STUDENT_HREF,
    accent: "green",
    tilt: "hover:-rotate-1",
    icon: <BookOpen className="h-6 w-6 stroke-[2]" />,
  },
];

/**
 * The first page of the notebook: choosing a space. It's the one step
 * between the landing and the app, so it wears the same paper as /about
 * and the landing's sheets rather than the old neon panel.
 */
export function SpaceSelectorModal({ onSelect }: SpaceSelectorModalProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <section className="notebook-paper relative flex min-h-dvh w-full items-center justify-center overflow-hidden px-5 py-14 sm:px-8">
      <button
        type="button"
        onClick={handleBack}
        aria-label="უკან"
        className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-20 inline-flex items-center gap-1.5 rounded-full border-2 border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-700 backdrop-blur-sm transition hover:border-slate-300 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:border-white/25 dark:hover:bg-white/15 sm:left-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
        უკან
      </button>
      <RainbowArc className="pointer-events-none absolute right-6 top-10 hidden w-28 -rotate-6 opacity-90 lg:block lg:w-36" />
      <Sun className="pointer-events-none absolute left-8 top-16 hidden h-12 w-12 text-amber-500/70 lg:block dark:text-amber-300/60" />
      <Sparkle className="pointer-events-none absolute left-1/4 top-8 hidden h-5 w-5 -rotate-12 text-sky-400 xl:block" />
      <Pencil className="pointer-events-none absolute bottom-16 left-10 hidden h-12 w-12 -rotate-12 text-amber-600/70 xl:block dark:text-amber-400/60" />
      <Ruler className="pointer-events-none absolute bottom-20 right-10 hidden w-24 rotate-12 text-slate-400 xl:block dark:text-slate-500" />
      <Flower className="pointer-events-none absolute bottom-10 right-1/4 hidden h-11 w-11 rotate-12 text-pink-400/70 xl:block dark:text-pink-400/50" />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="stagger-in mb-9 text-center" style={{ animationDelay: "120ms" }}>
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
              <Rocket className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
            </span>
            <span className="headline text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              SpaceEdu
            </span>
          </div>

          <span
            className={`mb-4 inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-xs font-bold ${ACCENT_PILL.violet}`}
          >
            დაიწყე მოგზაურობა
          </span>

          <h1 className="headline mb-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            აირჩიე შენი <span className={ACCENT_TEXT.blue}>სივრცე</span>
          </h1>
          <p className="text-sm leading-relaxed text-slate-700 sm:text-base dark:text-slate-300">
            სწავლის გამოცდილება მორგებული შენს საჭიროებებზე
          </p>
        </div>

        <div className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-3">
          {SPACES.map((space, index) => (
            <SpaceCard
              key={space.id}
              space={space}
              animationDelayMs={170 + index * 90}
              onClick={() => space.available && onSelect(space.id)}
            />
          ))}
        </div>

        <p
          className="stagger-in text-center text-xs text-slate-600 dark:text-slate-400"
          style={{ animationDelay: "420ms" }}
        >
          უკვე გაქვს ანგარიში?{" "}
          <Link
            href="/login"
            className={`font-bold underline underline-offset-4 ${ACCENT_TEXT.violet}`}
          >
            შესვლა
          </Link>
        </p>
      </div>
    </section>
  );
}
