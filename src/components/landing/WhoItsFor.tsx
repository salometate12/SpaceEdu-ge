import type { LucideIcon } from "lucide-react";
import { GraduationCap, Target } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Flower } from "./notebook/Doodles";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_TEXT,
  type NotebookAccent,
} from "./notebook/accents";

interface AudienceCard {
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
  tag: string;
  accent: NotebookAccent;
  tilt: string;
}

const AUDIENCES: AudienceCard[] = [
  {
    id: "school",
    title: "სკოლა",
    body: "დაეხმარე თავს ყოველდღიურ საშინაო დავალებებსა და გაკვეთილების მომზადებაში.",
    icon: GraduationCap,
    tag: "I–XII კლასი",
    accent: "violet",
    tilt: "hover:-rotate-1",
  },
  {
    id: "exams",
    title: "გამოცდები",
    body: "მოემზადე ეროვნული და საერთაშორისო გამოცდებისთვის სტრუქტურირებული გეგმით.",
    icon: Target,
    tag: "ეროვნული გამოცდები, SAT, IELTS",
    accent: "green",
    tilt: "hover:rotate-1",
  },
  {
    id: "university",
    title: "უნივერსიტეტი",
    body: "გართულებულ საგნებში სწრაფად გაერკვე AI ასისტენტითა და კონსპექტებით.",
    icon: GraduationCap,
    tag: "ბაკალავრიატი, მაგისტრატურა",
    accent: "pink",
    tilt: "hover:-rotate-1",
  },
];

export function WhoItsFor() {
  return (
    <section
      id="audience"
      className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20"
    >
      <Flower className="pointer-events-none absolute right-8 top-12 hidden h-12 w-12 -rotate-12 text-pink-400/70 xl:block dark:text-pink-400/50" />

      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="headline text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-50">
          ვისთვის არის SpaceEdu
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base dark:text-slate-300">
          ერთი პლატფორმა — სწავლის ყველა საფეხურისთვის
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-3">
        {AUDIENCES.map((audience, index) => {
          const Icon = audience.icon;
          return (
            <RevealOnScroll key={audience.id} delayMs={90 * (index + 1)}>
              <article
                id={audience.id}
                className={`h-full rounded-2xl border-2 p-7 transition-transform duration-300 ${audience.tilt} ${ACCENT_CARD[audience.accent]}`}
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${ACCENT_CARD[audience.accent]}`}
                >
                  <Icon
                    className={`h-6 w-6 stroke-[2] ${ACCENT_TEXT[audience.accent]}`}
                    aria-hidden
                  />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-50">
                  {audience.title}
                </h3>
                <p className="mb-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {audience.body}
                </p>
                <span
                  className={`inline-flex rounded-full border-2 px-3.5 py-1.5 text-xs font-semibold ${ACCENT_PILL[audience.accent]}`}
                >
                  {audience.tag}
                </span>
              </article>
            </RevealOnScroll>
          );
        })}
      </div>
    </section>
  );
}
