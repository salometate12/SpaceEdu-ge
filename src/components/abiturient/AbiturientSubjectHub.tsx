"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowLeft, ChevronRight, Layers, PlayCircle } from "lucide-react";
import { getSubjectHub } from "@/lib/abiturient-subject-hub";
import { getSecondaryTheme } from "@/lib/abiturient-subjects";
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

export function AbiturientSubjectHub({ subjectId, premiumSlot }: AbiturientSubjectHubProps) {
  const subject = getSubjectHub(subjectId);

  if (!subject) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-zinc-400">საგანი ვერ მოიძებნა.</p>
        <Link href={DASHBOARD_ABIT_HREF} className="mt-4 inline-block text-sm text-purple-400 hover:text-purple-300">
          დაბრუნება დეშბორდზე
        </Link>
      </main>
    );
  }

  const Icon = subject.icon;
  const percent =
    subject.total > 0
      ? Math.round((subject.answered / subject.total) * 100)
      : 0;

  if (subject.locked) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href={DASHBOARD_ABIT_HREF}
          className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-zinc-300 transition hover:border-purple-400/30 hover:text-white"
          aria-label="დაბრუნება"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="rounded-2xl border border-white/[0.06] bg-[#16161a]/40 p-8 text-center backdrop-blur-xl">
          <Icon className={`mx-auto h-10 w-10 ${subject.theme.iconText}`} strokeWidth={1.5} />
          <h1 className="mt-4 text-2xl font-bold text-white">{subject.title}</h1>
          <p className="mt-2 text-sm text-zinc-500">ეს საგანი მალე გაიხსნება.</p>
        </div>
      </main>
    );
  }

  const cardsHref = flashcardHref(subject.id, subject.deckId);
  const secondaryTheme = getSecondaryTheme(subjectId);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href={DASHBOARD_ABIT_HREF}
        className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-zinc-300 transition hover:border-purple-400/30 hover:text-white"
        aria-label="დაბრუნება"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <section
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#16161a]/40 p-6 backdrop-blur-xl"
        style={{ ["--subject-glow-color" as string]: subject.theme.glow }}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-[0.12] blur-xl"
          style={{
            background:
              "radial-gradient(circle, var(--subject-glow-color) 0%, transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative z-[1] flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-xl border ${subject.theme.iconRing}`}
            >
              <Icon className={`h-7 w-7 ${subject.theme.iconText}`} strokeWidth={1.5} />
            </div>
            <div
              className="border-l-2 py-0.5 pl-3"
              style={{ borderColor: subject.theme.glow }}
            >
              <p className="text-xs uppercase tracking-wide text-zinc-500">საგნის სფეისი</p>
              <h1 className="text-2xl font-bold text-white">{subject.title}</h1>
              <p className="mt-0.5 text-sm text-zinc-400">
                {subject.answered}/{subject.total} კითხვა • {percent}%
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href={subjectId === "georgian" ? quizHrefForGeorgianSubject() : "/quiz"}
          className={`group relative block overflow-hidden rounded-2xl border border-white/[0.06] bg-[#16161a]/40 p-5 backdrop-blur-xl transition-all hover:-translate-y-0.5 ${secondaryTheme.hoverBorder}`}
          style={{ ["--secondary-glow-color" as string]: secondaryTheme.glow } as CSSProperties}
        >
          <div
            className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full opacity-[0.1] blur-2xl transition-all duration-300 group-hover:opacity-[0.18]"
            style={{ background: "radial-gradient(circle, var(--secondary-glow-color) 0%, transparent 70%)" }}
            aria-hidden
          />
          <div
            className={`relative z-[1] mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${secondaryTheme.iconRing}`}
          >
            <PlayCircle className={`h-5 w-5 ${secondaryTheme.iconText}`} strokeWidth={1.5} />
          </div>
          <h2 className="relative z-[1] text-lg font-semibold text-white">კითხვების პანელი</h2>
          <p className="relative z-[1] mt-1 text-xs leading-relaxed text-zinc-400">
            გაიმეორე ბანკის კითხვები და შეამოწმე პასუხები.
          </p>
          <span
            className={`relative z-[1] mt-4 inline-flex items-center gap-1 text-xs font-medium ${secondaryTheme.ctaText}`}
          >
            გაგრძელება
            <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          href={cardsHref}
          className={`group relative block overflow-hidden rounded-2xl border border-white/[0.06] bg-[#16161a]/40 p-5 backdrop-blur-xl transition-all hover:-translate-y-0.5 ${subject.theme.hoverBorder}`}
        >
          <div
            className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${subject.theme.iconRing}`}
          >
            <Layers className={`h-5 w-5 ${subject.theme.iconText}`} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-semibold text-white">ბარათების სესია</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            ინტერაქტიული ფლეშბარათები გამოცდის სიმოკლის გასაამაგრებლად.
          </p>
          <span
            className={`mt-4 inline-flex items-center gap-1 text-xs font-medium ${subject.theme.ctaText}`}
          >
            გაგრძელება
            <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      </section>

      <section className="mt-6">
        {premiumSlot ?? (
          <SubjectSpacePremiumCard theme={subject.theme} href={`/subject/${subjectId}/space`} />
        )}
      </section>
    </main>
  );
}
