import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import type { AboutContent } from "@/lib/about-content";
import { AboutControls } from "./AboutControls";
import { Bulb, Flower, RainbowArc, Sparkle } from "../notebook/Doodles";
import { Segments } from "./AboutText";

export function AboutUsHero({ content }: { content: AboutContent }) {
  return (
    <section className="relative pb-10 pt-10 sm:pb-16 sm:pt-16">
      {/* Margin decorations. Hidden on the narrowest screens, where the
          text column already fills the sheet. */}
      <RainbowArc className="pointer-events-none absolute right-0 top-24 hidden w-28 -rotate-6 opacity-90 sm:block lg:w-36" />
      <Sparkle className="pointer-events-none absolute right-40 top-32 hidden h-5 w-5 rotate-12 text-amber-400 lg:block" />
      <Flower className="pointer-events-none absolute -left-2 bottom-6 hidden h-12 w-12 -rotate-12 text-pink-400/80 lg:block dark:text-pink-400/60" />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <span className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-800/80 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-800 dark:border-white/20 dark:bg-white/[0.06] dark:text-slate-100">
          <Bulb className="h-4 w-4 text-amber-500 dark:text-amber-300" />
          {content.eyebrow}
        </span>
        <AboutControls switchLabel={content.languageSwitchLabel} />
      </div>

      <RevealOnScroll>
        <h1 className="headline mt-7 text-[2rem] font-bold leading-[1.15] tracking-tight text-slate-900 sm:mt-9 sm:text-5xl dark:text-slate-50">
          <Segments value={content.title} />
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-700 sm:text-xl dark:text-slate-300">
          <Segments value={content.intro} underline />
        </p>
      </RevealOnScroll>
    </section>
  );
}
