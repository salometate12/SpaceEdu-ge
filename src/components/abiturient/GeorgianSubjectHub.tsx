"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  BookText,
  ChevronLeft,
  ClipboardList,
  PenTool,
} from "lucide-react";
import {
  Flower,
  Pencil,
  RainbowArc,
  Ruler,
  Sparkle,
  Sun,
} from "@/components/landing/notebook/Doodles";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_SOLID,
  ACCENT_TEXT,
  type NotebookAccent,
} from "@/components/landing/notebook/accents";

const GEORGIAN_SUBJECT_HREF = "/subject/georgian";

interface SubjectExerciseCardProps {
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

function SubjectExerciseCard({
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

export function GeorgianSubjectHub() {
  return (
    <main className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Margin doodles, as on /about — kept to the edges so they decorate
          the page rather than crowd the cards. */}
      <RainbowArc className="pointer-events-none absolute right-6 top-6 hidden w-28 -rotate-6 opacity-80 lg:block" />
      <Sun className="pointer-events-none absolute left-2 top-40 hidden h-11 w-11 text-amber-500/60 xl:block dark:text-amber-300/50" />
      <Sparkle className="pointer-events-none absolute left-1/3 top-4 hidden h-4 w-4 -rotate-12 text-sky-400 opacity-70 xl:block" />
      <Ruler className="pointer-events-none absolute -left-4 bottom-40 hidden w-20 rotate-12 text-slate-400 opacity-60 xl:block dark:text-slate-500" />
      <Pencil className="pointer-events-none absolute -right-3 bottom-24 hidden h-11 w-11 -rotate-12 text-amber-600/50 xl:block dark:text-amber-400/40" />

      <Link
        href={GEORGIAN_SUBJECT_HREF}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
        საგნის სფეისზე დაბრუნება
      </Link>

      <header className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-center">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${ACCENT_CARD.pink} ${ACCENT_TEXT.pink}`}
        >
          <BookOpen className="h-7 w-7 stroke-[2]" aria-hidden />
        </span>
        <div>
          <h1 className="headline text-3xl font-bold text-slate-900 dark:text-slate-50">
            ქართული ენა და ლიტერატურა
          </h1>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            აირჩიე სასურველი საგამოცდო კომპონენტი და დაიწყე მომზადება.
          </p>
        </div>
      </header>

      <section
        className="grid grid-cols-1 gap-5 md:grid-cols-3"
        aria-label="საგამოცდო მოდულები"
      >
        <SubjectExerciseCard
          title="ტექსტის რედაქტირება"
          badgeText="სატესტო რეჟიმი"
          description="პირველი სავარჯიშო. გაასწორე ორთოგრაფიული, პუნქტუაციური თუ სინტაქსური ხარვეზები და მიიღე დეტალური შეფასება."
          icon={<ClipboardList className="h-10 w-10 stroke-[1.75]" aria-hidden />}
          btnText="დაწყება"
          href="/subject/georgian/text-editing"
          accent="violet"
          tilt="hover:-rotate-1"
          corner={<Sparkle className="h-5 w-5 rotate-12 text-violet-400" />}
        />

        <SubjectExerciseCard
          title="მეორე სავარჯიშო"
          badgeText="წაკითხულის გააზრება"
          description="იმუშავე მხატვრულ თუ საინფორმაციო ტექსტებზე. განავითარე წაკითხულის გააზრების, ანალიზისა და ლოგიკური დასკვნების უნარი."
          icon={<BookText className="h-10 w-10 stroke-[1.75]" aria-hidden />}
          btnText="ტესტის დაწყება"
          href="/subject/georgian/reading-comprehension"
          accent="blue"
          tilt="hover:rotate-1"
          corner={<Flower className="h-9 w-9 -rotate-12 text-sky-400/80" />}
        />

        <SubjectExerciseCard
          title="წერითი დავალება (თემა)"
          badgeText="ესე / თემა"
          description="დაწერე თემა წინა წლების რეალურ საგამოცდო დავალებაზე — თემა შემთხვევით ამოვა და AI შეაფასებს რუბრიკის მიხედვით."
          icon={<PenTool className="h-10 w-10 stroke-[1.75]" aria-hidden />}
          btnText="დაწყება"
          href="/subject/georgian/essay-practice"
          accent="pink"
          tilt="hover:-rotate-1"
          corner={<Sparkle className="h-5 w-5 -rotate-12 text-pink-400" />}
        />
      </section>
    </main>
  );
}
