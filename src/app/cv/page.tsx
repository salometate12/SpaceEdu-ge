import { CvGenerator } from "@/components/cv/CvGenerator";
import { ToolPageHeader } from "@/components/layout/ToolPageHeader";

export default function CvPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <ToolPageHeader
        title="AI CV გენერატორი"
        subtitle="შეავსე შენი მონაცემები და AI შეგირჩევს იდეალურ სტრუქტურას სტაჟირებებისა და ვაკანსიებისთვის."
      />
      <CvGenerator />
    </main>
  );
}
