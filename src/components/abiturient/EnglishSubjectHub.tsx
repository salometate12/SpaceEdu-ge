"use client";

import Link from "next/link";
import { ChevronLeft, Headphones, Languages, PenTool } from "lucide-react";
import { Flower, Pencil, Ruler, Sparkle } from "@/components/landing/notebook/Doodles";
import { ACCENT_CARD, ACCENT_TEXT } from "@/components/landing/notebook/accents";
import { SubjectExerciseCard } from "@/components/abiturient/SubjectExerciseCard";

/** English Space hub — the English equivalent of MathSubjectHub. Two cards: the
 *  answer-key tasks (listening / reading / vocabulary / grammar / dialogue) with
 *  instant checking, and the AI-graded Task 7 essay. Colours: amber (primary),
 *  blue (secondary). */
export function EnglishSubjectHub() {
  return (
    <main className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <Sparkle className="pointer-events-none absolute left-1/3 top-4 hidden h-4 w-4 -rotate-12 text-amber-400 opacity-70 xl:block" />
      <Ruler className="pointer-events-none absolute -left-4 bottom-40 hidden w-20 rotate-12 text-slate-400 opacity-60 xl:block dark:text-slate-500" />
      <Pencil className="pointer-events-none absolute -right-3 bottom-24 hidden h-11 w-11 -rotate-12 text-amber-600/50 xl:block dark:text-amber-400/40" />

      <Link
        href="/subject/english"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
        საგნის სფეისზე დაბრუნება
      </Link>

      <header className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-center">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${ACCENT_CARD.amber} ${ACCENT_TEXT.amber}`}
        >
          <Languages className="h-7 w-7 stroke-[2]" aria-hidden />
        </span>
        <div>
          <h1 className="headline text-3xl font-bold text-slate-900 dark:text-slate-50">
            ინგლისური ენა
          </h1>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            აირჩიე საგამოცდო კომპონენტი და ივარჯიშე წინა წლების რეალურ დავალებებზე.
          </p>
        </div>
      </header>

      <section
        className="grid grid-cols-1 gap-5 md:grid-cols-2"
        aria-label="საგამოცდო მოდულები"
      >
        <SubjectExerciseCard
          title="ტესტური დავალებები"
          badgeText="სატესტო რეჟიმი"
          description="შემთხვევით ამოსული დავალება წინა წლების რეალური გამოცდებიდან — მოსმენა, კითხვა, ლექსიკა, გრამატიკა და დიალოგი. უპასუხე და მაშინვე ნახე სწორია თუ არა, ახსნით."
          icon={<Headphones className="h-10 w-10 stroke-[1.75]" aria-hidden />}
          btnText="დაწყება"
          href="/subject/english/task-practice"
          accent="amber"
          tilt="hover:-rotate-1"
          corner={<Sparkle className="h-5 w-5 rotate-12 text-amber-400" />}
        />

        <SubjectExerciseCard
          title="წერითი დავალება"
          badgeText="ღია პასუხი · AI შეფასება"
          description="დაწერე ესე შემთხვევით ამოსულ თემაზე და მიიღე AI შეფასება ოფიციალური კრიტერიუმებით — შინაარსი, ორგანიზება, ლექსიკა და გრამატიკა (თითო 4 ქულა)."
          icon={<PenTool className="h-10 w-10 stroke-[1.75]" aria-hidden />}
          btnText="დაწყება"
          href="/subject/english/writing-practice"
          accent="blue"
          tilt="hover:rotate-1"
          corner={<Flower className="h-9 w-9 -rotate-12 text-sky-400/80" />}
        />
      </section>
    </main>
  );
}
