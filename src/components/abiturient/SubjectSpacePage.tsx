"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, ChevronLeft, Layers, PlayCircle, Sparkles } from "lucide-react";
import { getSubjectHub } from "@/lib/abiturient-subject-hub";
import { subjectHubHref, type SubjectTheme } from "@/lib/abiturient-subjects";

interface SubjectSpacePageProps {
  subjectId: string;
}

function flashcardHref(deckId?: string): string {
  return deckId ? `/deck/${deckId}` : "/generate";
}

interface ModuleCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  btnText: string;
  theme: SubjectTheme;
}

function ModuleCard({ title, description, icon, href, btnText, theme }: ModuleCardProps) {
  return (
    <article
      className={`group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121214]/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${theme.hoverBorder}`}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full opacity-[0.08] blur-2xl transition-all duration-300 group-hover:opacity-[0.16]"
        style={{ background: "radial-gradient(circle, var(--subject-glow-color) 0%, transparent 70%)" }}
        aria-hidden
      />
      <div className="relative z-[1]">
        <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border ${theme.iconRing}`}>
          {icon}
        </div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-400">{description}</p>
      </div>
      <Link
        href={href}
        className={`relative z-[1] mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all active:scale-[0.98] ${theme.iconRing} ${theme.ctaText}`}
      >
        {btnText}
        <ArrowRight className="h-4 w-4 stroke-[1.5] transition-transform group-hover:translate-x-0.5" />
      </Link>
    </article>
  );
}

/**
 * Generic per-subject "Space" landing page. Georgian has its own bespoke
 * version (GeorgianSubjectHub) with exam-format-specific exercises; every
 * other subject gets this themed placeholder — real modules for reading
 * comprehension / text editing / essays etc. will replace the "coming soon"
 * block once those exercise types exist for each subject.
 */
export function SubjectSpacePage({ subjectId }: SubjectSpacePageProps) {
  const subject = getSubjectHub(subjectId);

  if (!subject) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-zinc-400">საგანი ვერ მოიძებნა.</p>
      </main>
    );
  }

  const Icon = subject.icon;
  const theme = subject.theme;
  const cardsHref = flashcardHref(subject.deckId);

  return (
    <div
      className="relative min-h-full bg-transparent"
      style={{ ["--subject-glow-color" as string]: theme.glow } as CSSProperties}
    >
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href={subjectHubHref(subject.id)}
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-gray-400 transition-all hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
          საგნის სფეისზე დაბრუნება
        </Link>

        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border ${theme.iconRing}`}>
            <Icon className={`h-7 w-7 stroke-[1.5] ${theme.iconText}`} />
          </div>
          <div>
            <p className={`mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${theme.iconText} opacity-80`}>
              <Layers className="h-3 w-3 stroke-[1.5]" />
              Premium Space
            </p>
            <h1 className="text-3xl font-bold text-white">{subject.title}</h1>
            <p className="mt-1 text-sm text-gray-400">
              დამატებითი სავარჯიშოები და AI დახმარება ერთ სივრცეში.
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2" aria-label="საგამოცდო მოდულები">
          <ModuleCard
            title="ტესტების ბანკი"
            description="გაიარე სრული სატესტო ბანკი და თვალი ადევნე პროგრესს რეალურ დროში."
            icon={<PlayCircle className={`h-6 w-6 stroke-[1.5] ${theme.iconText}`} />}
            href="/quiz"
            btnText="დაწყება"
            theme={theme}
          />
          <ModuleCard
            title="ფლეშ ბარათები"
            description="ინტერაქტიული ბარათები საკვანძო ცნებების სწრაფად დასამახსოვრებლად."
            icon={<Layers className={`h-6 w-6 stroke-[1.5] ${theme.iconText}`} />}
            href={cardsHref}
            btnText="დაწყება"
            theme={theme}
          />
        </section>

        <section className="mt-6" aria-label="მალე დაემატება">
          <article className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121214]/60 p-6 backdrop-blur-xl">
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-[0.08] blur-2xl"
              style={{ background: "radial-gradient(circle, var(--subject-glow-color) 0%, transparent 70%)" }}
              aria-hidden
            />
            <div className="relative z-[1] flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${theme.iconRing}`}>
                <Sparkles className={`h-6 w-6 stroke-[1.5] ${theme.iconText}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-white">საგნის სპეციფიკური სავარჯიშოები</h2>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                    მალე
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-gray-400">
                  ამ საგნისთვის მორგებული საგამოცდო ფორმატის სავარჯიშოები — მსგავსად ქართული ენის
                  Space-ისა — მალე დაემატება.
                </p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
