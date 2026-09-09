import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import type { AboutContent } from "@/lib/about-content";
import { Pencil, Ruler, Sparkle } from "./Doodles";
import { Segments } from "./AboutText";

export function AboutUsStory({ content }: { content: AboutContent }) {
  return (
    <section className="relative space-y-12 pb-4 sm:space-y-16">
      <Ruler className="pointer-events-none absolute -right-4 top-10 hidden w-24 rotate-12 text-slate-400 lg:block dark:text-slate-500" />
      <Pencil className="pointer-events-none absolute -left-6 top-1/2 hidden h-12 w-12 -rotate-12 text-amber-600/80 lg:block dark:text-amber-400/70" />

      {content.chapters.map((chapter, index) => (
        <RevealOnScroll key={index} delayMs={index * 80}>
          <article>
            <h2 className="headline flex items-start gap-2 text-2xl font-bold leading-snug text-slate-900 sm:text-3xl dark:text-slate-50">
              <Sparkle className="mt-1.5 h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <Segments value={chapter.heading} />
              </span>
            </h2>
            <div className="mt-4 space-y-4 pl-6">
              {chapter.body.map((paragraph, paragraphIndex) => (
                <p
                  key={paragraphIndex}
                  className="max-w-2xl text-base leading-[1.9] text-slate-700 sm:text-[17px] dark:text-slate-300"
                >
                  <Segments value={paragraph} underline />
                </p>
              ))}
            </div>
          </article>
        </RevealOnScroll>
      ))}
    </section>
  );
}
