import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export function CTASection() {
  return (
    <section>
      <RevealOnScroll delayMs={120}>
        <div className="rounded-[32px] bg-[#fce7f3] px-6 py-12 text-center sm:px-14 sm:py-16 dark:bg-[rgba(236,72,153,0.12)]">
          <h2 className="text-[26px] font-bold leading-tight tracking-tight text-[var(--ld-title)] sm:text-[34px]">
            მზად ხარ, რომ შექმნა შენი სასწავლო{" "}
            <span className="bg-[linear-gradient(transparent_60%,#f9a8d4_60%)] px-[0.08em] dark:bg-[linear-gradient(transparent_60%,rgba(236,72,153,0.45)_60%)]">
              სივრცე
            </span>
            ?
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--ld-text)] sm:text-[16px]">დაიწყე დღესვე, უფასოდ და ბარათის გარეშე.</p>
          <Link
            href="/select-space"
            className="ld-primary ld-focus mt-7 inline-flex h-[52px] items-center gap-2 rounded-full px-8 text-[16px] font-semibold transition-colors"
          >
            უფასოდ დაწყება
            <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
          </Link>
        </div>
      </RevealOnScroll>
    </section>
  );
}
