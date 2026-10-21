import { Noto_Serif_Georgian } from "next/font/google";
import { CvGenerator } from "@/components/cv/CvGenerator";
import { ToolPageHeader } from "@/components/layout/ToolPageHeader";

/** The classic template's serif (the sans is the site's own). */
const notoSerifGeorgian = Noto_Serif_Georgian({
  variable: "--font-noto-serif-georgian",
  subsets: ["georgian", "latin"],
  weight: ["400", "600", "700"],
});

export default function CvPage() {
  return (
    <main className={`${notoSerifGeorgian.variable} mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8`}>
      <ToolPageHeader
        title="AI CV გენერატორი"
        subtitle="შეავსე შენი მონაცემები და AI შეგირჩევს იდეალურ სტრუქტურას სტაჟირებებისა და ვაკანსიებისთვის."
      />
      <CvGenerator />
    </main>
  );
}
