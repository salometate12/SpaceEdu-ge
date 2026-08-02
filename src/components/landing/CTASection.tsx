import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export function CTASection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <RevealOnScroll delayMs={120}>
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-700/40 via-indigo-700/30 to-cyan-700/30 p-10 text-center transition-all duration-300 hover:shadow-[0_0_45px_rgba(124,58,237,0.3)] sm:p-14">
          <div
            className="pointer-events-none absolute -left-10 top-1/2 -z-0 h-[220px] w-[260px] -translate-y-1/2 rounded-full bg-purple-500/25 blur-[90px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-10 top-1/2 -z-0 h-[220px] w-[260px] -translate-y-1/2 rounded-full bg-cyan-500/20 blur-[90px]"
            aria-hidden
          />
          <div className="relative z-[1]">
            <h2 className="headline text-2xl font-bold text-white sm:text-3xl">
              მზად ხარ, დაიწყო შენი სასწავლო Space?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-300 sm:text-base">
              შემოგვიერთდი დღესვე — უფასოდ, ბარათის გარეშე.
            </p>
            <Link
              href="/select-space"
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-[0_0_25px_rgba(124,58,237,0.4)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_38px_rgba(124,58,237,0.6)] active:scale-[0.98]"
            >
              უფასოდ დაწყება
              <ArrowUpRight className="h-4 w-4 stroke-[2.5] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
