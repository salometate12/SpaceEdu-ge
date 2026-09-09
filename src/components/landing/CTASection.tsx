import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { RainbowArc } from "./notebook/Doodles";
import { ACCENT_CARD, ACCENT_SOLID } from "./notebook/accents";

export function CTASection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
      <RevealOnScroll delayMs={120}>
        <div
          className={`relative overflow-hidden rounded-[1.75rem] border-2 p-10 text-center sm:p-14 ${ACCENT_CARD.violet}`}
        >
          <RainbowArc className="pointer-events-none absolute -left-6 -top-4 hidden w-28 -rotate-12 opacity-80 sm:block" />
          <h2 className="headline text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-50">
            მზად ხარ, დაიწყო შენი სასწავლო Space?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base dark:text-slate-300">
            შემოგვიერთდი დღესვე — უფასოდ, ბარათის გარეშე.
          </p>
          <Link
            href="/select-space"
            className={`paper-sticker group mt-6 inline-flex items-center gap-2 rounded-full border-2 px-8 py-4 text-base font-bold ${ACCENT_SOLID.violet}`}
          >
            უფასოდ დაწყება
            <ArrowUpRight className="h-4 w-4 stroke-[2.5] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </RevealOnScroll>
    </section>
  );
}
