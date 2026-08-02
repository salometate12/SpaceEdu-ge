import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export function CTASection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <RevealOnScroll delayMs={120}>
        <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-600/30 to-indigo-600/20 p-8 text-center transition-all duration-300 hover:shadow-[0_0_35px_rgba(124,58,237,0.35)]">
          <h2 className="headline text-2xl font-bold">
            მზად ხარ უფრო ჭკვიანურად ისწავლო?
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            დღეს დაიწყე — 5 წუთში შექმენი პირველი სასწავლო გეგმა.
          </p>
          <Link href="/select-space" className="mt-5 inline-block">
            <Button>დაიწყე უფასოდ ↗</Button>
          </Link>
        </div>
      </RevealOnScroll>
    </section>
  );
}
