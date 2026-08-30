"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  BookText,
  ChevronLeft,
  ClipboardList,
  PenTool,
} from "lucide-react";

const GEORGIAN_SUBJECT_HREF = "/subject/georgian";

type BadgeType = "purple" | "blue" | "rose" | "amber";
type CtaVariant = "purple" | "cyan" | "rose" | "ghost";

const BADGE_STYLES: Record<BadgeType, string> = {
  purple: "border border-purple-500/20 bg-purple-500/10 text-purple-400",
  blue: "border border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
  rose: "border border-rose-500/20 bg-rose-500/10 text-rose-400",
  amber: "border border-amber-500/20 bg-amber-500/10 text-amber-400",
};

const CTA_STYLES: Record<CtaVariant, string> = {
  purple:
    "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 text-white",
  cyan: "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 text-white",
  rose: "bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20 text-white",
  ghost:
    "border border-white/[0.06] bg-white/[0.03] text-white/90 hover:border-amber-500/30 hover:bg-white/[0.06]",
};

interface SubjectExerciseCardProps {
  title: string;
  badgeText?: string;
  badgeType?: BadgeType;
  description: string;
  icon: ReactNode;
  btnText: string;
  glowColor: string;
  href: string;
  ctaVariant?: CtaVariant;
  hoverBorder?: string;
}

function SubjectExerciseCard({
  title,
  badgeText,
  badgeType = "purple",
  description,
  icon,
  btnText,
  glowColor,
  href,
  ctaVariant = "purple",
  hoverBorder = "hover:border-purple-500/30",
}: SubjectExerciseCardProps) {
  return (
    <article
      className={`group relative flex min-h-[440px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121214]/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${hoverBorder}`}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full opacity-[0.08] blur-2xl transition-all duration-300 group-hover:opacity-[0.16]"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-12 h-28 w-28 rounded-full opacity-[0.04] blur-2xl"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
        }}
        aria-hidden
      />

      <div className="relative z-[1]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-xl font-bold tracking-wide text-white">{title}</h2>
          {badgeText && (
            <span
              className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${BADGE_STYLES[badgeType]}`}
            >
              {badgeText}
            </span>
          )}
        </div>
        <p className="text-sm leading-relaxed text-gray-400">{description}</p>
      </div>

      <div className="relative z-[1] flex flex-1 items-center justify-center py-8">
        <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] ring-1 ring-white/[0.04] transition-all duration-300 group-hover:border-white/[0.1] group-hover:bg-white/[0.04]">
          {icon}
        </div>
      </div>

      <Link
        href={href}
        className={`relative z-[1] mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.98] ${CTA_STYLES[ctaVariant]}`}
      >
        {btnText}
        <ArrowRight className="h-4 w-4 stroke-[1.5] transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </article>
  );
}

export function GeorgianSubjectHub() {
  return (
    <div className="relative min-h-full bg-transparent">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href={GEORGIAN_SUBJECT_HREF}
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-gray-400 transition-all hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
          საგნის სფეისზე დაბრუნება
        </Link>

        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 shadow-[0_0_28px_rgba(139,92,246,0.22)] ring-1 ring-violet-500/20">
            <BookOpen className="h-7 w-7 stroke-[1.5]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">ქართული ენა და ლიტერატურა</h1>
            <p className="mt-1 text-sm text-gray-400">
              აირჩიე სასურველი საგამოცდო კომპონენტი და დაიწყე მომზადება.
            </p>
          </div>
        </header>

        <section
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
          aria-label="საგამოცდო მოდულები"
        >
          <SubjectExerciseCard
            title="ტექსტის რედაქტირება"
            badgeText="სატესტო რეჟიმი"
            badgeType="purple"
            description="პირველი სავარჯიშო. გაასწორე ორთოგრაფიული, პუნქტუაციური თუ სინტაქსური ხარვეზები და მიიღე დეტალური შეფასება."
            icon={
              <ClipboardList
                className="h-10 w-10 stroke-[1.5] text-purple-400"
                style={
                  {
                    filter: "drop-shadow(0 0 10px rgba(168,85,247,0.45))",
                  } as CSSProperties
                }
              />
            }
            btnText="დაწყება"
            glowColor="#8B5CF6"
            href="/subject/georgian/text-editing"
            ctaVariant="purple"
          />

          <SubjectExerciseCard
            title="მეორე სავარჯიშო"
            badgeText="წაკითხულის გააზრება"
            badgeType="blue"
            description="იმუშავე მხატვრულ თუ საინფორმაციო ტექსტებზე. განავითარე წაკითხულის გააზრების, ანალიზისა და ლოგიკური დასკვნების უნარი."
            icon={
              <BookText
                className="h-10 w-10 stroke-[1.5] text-cyan-400"
                style={
                  {
                    filter: "drop-shadow(0 0 10px rgba(34,211,238,0.4))",
                  } as CSSProperties
                }
              />
            }
            btnText="ტესტის დაწყება"
            glowColor="#06B6D4"
            href="/subject/georgian/reading-comprehension"
            ctaVariant="cyan"
            hoverBorder="hover:border-cyan-500/30"
          />

          <SubjectExerciseCard
            title="წერითი დავალება (თემა)"
            badgeText="ესე / თემა"
            badgeType="rose"
            description="დაწერე არგუმენტირებული ესეები და ლიტერატურული თემები. AI მასწავლებელი გაანალიზებს შენს სტილს და მოგცემს რეკომენდაციებს."
            icon={
              <PenTool
                className="h-10 w-10 stroke-[1.5] text-rose-400"
                style={
                  {
                    filter: "drop-shadow(0 0 10px rgba(244,63,94,0.4))",
                  } as CSSProperties
                }
              />
            }
            btnText="დაწყება"
            glowColor="#A855F7"
            href="/lit-assistant"
            ctaVariant="rose"
            hoverBorder="hover:border-rose-500/25"
          />
        </section>
      </main>
    </div>
  );
}
