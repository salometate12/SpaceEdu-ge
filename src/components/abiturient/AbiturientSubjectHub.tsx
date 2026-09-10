"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Archive, ArrowLeft, ChevronRight, Layers, PenLine, PlayCircle } from "lucide-react";
import { getSubjectHub } from "@/lib/abiturient-subject-hub";
import {
  subjectAccent,
  subjectSecondaryAccent,
  subjectTertiaryAccent,
} from "@/lib/subject-accents";
import { Flower, Sparkle } from "@/components/landing/notebook/Doodles";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_TEXT,
  PLAIN_CARD,
  type NotebookAccent,
} from "@/components/landing/notebook/accents";
import { DASHBOARD_ABIT_HREF } from "@/lib/dashboard-routes";
import { quizHrefForGeorgianSubject } from "@/lib/space-back-navigation";
import { SubjectSpacePremiumCard } from "./SubjectSpacePremiumCard";

interface AbiturientSubjectHubProps {
  subjectId: string;
  premiumSlot?: ReactNode;
}

function flashcardHref(subjectId: string, deckId?: string): string {
  if (deckId) return `/deck/${deckId}`;
  if (subjectId === "georgian") return "/generate?from=georgian";
  return "/generate";
}

const BACK_LINK_CLASS =
  "mb-6 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-300/80 bg-white/60 text-slate-600 transition-colors hover:border-slate-500 hover:text-slate-900 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white";

/** One card on the hub — icon, title, blurb, and a pill that reads as a link. */
function HubCard({
  href,
  accent,
  icon: Icon,
  title,
  body,
  cta,
}: {
  href: string;
  accent: NotebookAccent;
  icon: typeof Archive;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className={`group block rounded-2xl border-2 p-5 transition-transform duration-300 hover:-translate-y-1 ${ACCENT_CARD[accent]}`}
    >
      <span
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${ACCENT_CARD[accent]} ${ACCENT_TEXT[accent]}`}
      >
        <Icon className="h-5 w-5 stroke-[2]" aria-hidden />
      </span>
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">{body}</p>
      <span
        className={`mt-4 inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-xs font-bold ${ACCENT_PILL[accent]}`}
      >
        {cta}
        <ChevronRight className="h-3.5 w-3.5 stroke-[2.5] transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function AbiturientSubjectHub({ subjectId, premiumSlot }: AbiturientSubjectHubProps) {
  const subject = getSubjectHub(subjectId);
  const accent = subjectAccent(subjectId);
  const secondary = subjectSecondaryAccent(subjectId);

  if (!subject) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-slate-600 dark:text-slate-300">საგანი ვერ მოიძებნა.</p>
        <Link
          href={DASHBOARD_ABIT_HREF}
          className={`mt-4 inline-block text-sm font-bold ${ACCENT_TEXT.violet}`}
        >
          დაბრუნება დეშბორდზე
        </Link>
      </main>
    );
  }

  const Icon = subject.icon;
  const percent =
    subject.total > 0 ? Math.round((subject.answered / subject.total) * 100) : 0;

  if (subject.locked) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Link href={DASHBOARD_ABIT_HREF} className={BACK_LINK_CLASS} aria-label="დაბრუნება">
          <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
        </Link>
        <div className={`rounded-2xl border-2 p-8 text-center ${PLAIN_CARD}`}>
          <Icon
            className={`mx-auto h-10 w-10 stroke-[2] ${ACCENT_TEXT[accent]}`}
            aria-hidden
          />
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-50">
            {subject.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            ეს საგანი მალე გაიხსნება.
          </p>
        </div>
      </main>
    );
  }

  const cardsHref = flashcardHref(subject.id, subject.deckId);

  return (
    <main className="relative mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Sparkle
        className={`pointer-events-none absolute right-6 top-8 hidden h-4 w-4 -rotate-12 opacity-70 lg:block ${ACCENT_TEXT[accent]}`}
      />
      <Flower
        className={`pointer-events-none absolute -left-6 top-40 hidden h-10 w-10 rotate-12 opacity-50 xl:block ${ACCENT_TEXT[secondary]}`}
      />

      <Link href={DASHBOARD_ABIT_HREF} className={BACK_LINK_CLASS} aria-label="დაბრუნება">
        <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
      </Link>

      <section className={`rounded-2xl border-2 p-6 ${ACCENT_CARD[accent]}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${ACCENT_CARD[accent]} ${ACCENT_TEXT[accent]}`}
            >
              <Icon className="h-7 w-7 stroke-[2]" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                საგნის სფეისი
              </p>
              <h1 className="headline text-2xl font-bold text-slate-900 dark:text-slate-50">
                {subject.title}
              </h1>
              <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">
                {subject.answered}/{subject.total} კითხვა · {percent}%
              </p>
            </div>
          </div>
        </div>
      </section>

      {subject.id !== "georgian" && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <HubCard
            href={subjectId === "georgian" ? quizHrefForGeorgianSubject() : "/quiz"}
            accent={secondary}
            icon={PlayCircle}
            title="კითხვების პანელი"
            body="გაიმეორე ბანკის კითხვები და შეამოწმე პასუხები."
            cta="გაგრძელება"
          />
          <HubCard
            href={cardsHref}
            accent={accent}
            icon={Layers}
            title="Flashcards"
            body="ინტერაქტიული ფლეშბარათები გამოცდის სიმოკლის გასაამაგრებლად."
            cta="გაგრძელება"
          />
        </section>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2" aria-label="საგამოცდო რესურსები">
        <HubCard
          href={`/subject/${subject.id}/past-exams`}
          accent={accent}
          icon={Archive}
          title="ეროვნული გამოცდების არქივი"
          body="ტესტები წლებისა და ვარიანტების მიხედვით."
          cta="გახსნა"
        />
        <HubCard
          href={`/subject/${subject.id}/essay-grader`}
          accent="violet"
          icon={PenLine}
          title="ესეს შემფასებელი"
          body="შეფასება ეროვნული გამოცდის რუბრიკით და კონკრეტული შესწორებები."
          cta="გახსნა"
        />
      </section>

      <section className="mt-6">
        {premiumSlot ?? (
          <SubjectSpacePremiumCard
            accent={subjectTertiaryAccent(subjectId)}
            href={`/subject/${subjectId}/space`}
          />
        )}
      </section>
    </main>
  );
}
