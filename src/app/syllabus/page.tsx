import type { Metadata } from "next";
import { ToolPageHeader } from "@/components/layout/ToolPageHeader";
import { SyllabusAnalyzer } from "@/components/syllabus/SyllabusAnalyzer";
import { Flower, Pencil, Sparkle } from "@/components/landing/notebook/Doodles";
import { ACCENT_TEXT } from "@/components/landing/notebook/accents";

export const metadata: Metadata = {
  title: "სილაბუსის AI ანალიზატორი",
  description:
    "ჩააგდე საგნის სილაბუსის PDF და მიიღე სემესტრის მნიშვნელოვანი თარიღები, დალაგებული თარიღების მიხედვით.",
  alternates: { canonical: "/syllabus" },
};

export default function SyllabusPage() {
  return (
    <main className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <Sparkle
        className={`pointer-events-none absolute right-6 top-6 hidden h-4 w-4 -rotate-12 opacity-70 lg:block ${ACCENT_TEXT.violet}`}
      />
      <Flower className="pointer-events-none absolute -left-5 top-52 hidden h-10 w-10 rotate-12 text-pink-400/50 xl:block" />
      <Pencil className="pointer-events-none absolute -right-4 bottom-24 hidden h-11 w-11 rotate-12 text-amber-600/45 xl:block dark:text-amber-400/35" />

      <div className="space-y-6">
        <ToolPageHeader
          title="სილაბუსის AI ანალიზატორი"
          subtitle="ჩააგდე საგნის სილაბუსის PDF ფაილი და გარდაქმენი ის ინტერაქციულ სემესტრულ გეგმად."
        />
        <SyllabusAnalyzer />
      </div>
    </main>
  );
}
