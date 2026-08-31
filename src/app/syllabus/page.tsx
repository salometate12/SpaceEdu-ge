import { ToolPageHeader } from "@/components/layout/ToolPageHeader";
import { SyllabusAnalyzer } from "@/components/syllabus/SyllabusAnalyzer";

export default function SyllabusPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
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
