import Link from "next/link";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import type { AboutContent } from "@/lib/about-content";
import { Mountains } from "./Doodles";

export function AboutUsSignature({ content }: { content: AboutContent }) {
  return (
    <section className="relative pb-16 pt-14 sm:pb-24">
      <RevealOnScroll>
        <div className="flex flex-col items-center gap-4 text-center">
          <Mountains className="w-28 text-slate-500 sm:w-36 dark:text-slate-400" />
          <p className="max-w-md text-base leading-relaxed text-slate-700 dark:text-slate-300">
            {content.closing}
          </p>
          <Link
            href="/"
            className="headline text-lg font-bold tracking-tight text-slate-900 underline decoration-sky-400/60 decoration-[3px] underline-offset-[6px] transition-colors hover:text-sky-700 dark:text-slate-100 dark:hover:text-sky-300"
          >
            spaceedu.ge
          </Link>
        </div>
      </RevealOnScroll>
    </section>
  );
}
