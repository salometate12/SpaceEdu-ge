import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import type { AboutContent } from "@/lib/about-content";
import { Sun } from "./Doodles";
import { ACCENT_CARD, ACCENT_LABEL, Segments } from "./AboutText";

export function AboutUsAudience({ content }: { content: AboutContent }) {
  return (
    <section className="relative pb-4 pt-12 sm:pt-16">
      <Sun className="pointer-events-none absolute -right-2 top-10 hidden h-12 w-12 text-amber-500/80 lg:block dark:text-amber-300/70" />

      <RevealOnScroll>
        <h2 className="headline text-2xl font-bold leading-snug text-slate-900 sm:text-3xl dark:text-slate-50">
          <Segments value={content.audience.heading} />
        </h2>
      </RevealOnScroll>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {content.audience.items.map((item, index) => (
          <RevealOnScroll key={item.label} delayMs={index * 90}>
            {/* Slightly off-square corners and a tilt on hover: these read as
                cards stuck onto the page, not product tiles. */}
            <div
              className={`h-full rounded-2xl border-2 p-5 transition-transform duration-300 hover:-rotate-1 ${ACCENT_CARD[item.accent]}`}
            >
              <p className={`text-sm font-bold ${ACCENT_LABEL[item.accent]}`}>{item.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {item.text}
              </p>
            </div>
          </RevealOnScroll>
        ))}
      </div>

      <RevealOnScroll delayMs={120}>
        <div className="mt-10 border-t-2 border-dashed border-slate-300 pt-6 dark:border-white/15">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {content.values.heading}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {content.values.items.map((value) => (
              <li
                key={value}
                className="rounded-full border-2 border-slate-300 bg-white/60 px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:border-white/15 dark:bg-white/[0.05] dark:text-slate-200"
              >
                {value}
              </li>
            ))}
          </ul>
        </div>
      </RevealOnScroll>
    </section>
  );
}
