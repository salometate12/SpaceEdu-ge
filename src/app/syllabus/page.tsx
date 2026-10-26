import type { Metadata } from "next";
import { SyllabusAnalyzer } from "@/components/syllabus/SyllabusAnalyzer";
import "./syllabus-theme.css";

export const metadata: Metadata = {
  title: "სილაბუსის ანალიზატორი",
  description:
    "ჩააგდე საგნის სილაბუსის PDF და მიიღე სემესტრის მნიშვნელოვანი თარიღები, დალაგებული თარიღების მიხედვით.",
  alternates: { canonical: "/syllabus" },
};

export default function SyllabusPage() {
  return (
    <main>
      <SyllabusAnalyzer />
    </main>
  );
}
