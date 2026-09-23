import type { Metadata } from "next";
import { CivicsMcqPracticeLoader } from "@/components/abiturient/civics/CivicsMcqPracticeLoader";

export const metadata: Metadata = {
  title: "ტესტური კითხვები — სავარჯიშო",
  description:
    "ივარჯიშე ეროვნული გამოცდის სამოქალაქო განათლების ტესტურ კითხვებზე — წინა წლების რეალური ვარიანტებიდან, მყისიერი შემოწმებით.",
  alternates: { canonical: "/subject/civics/mcq-practice" },
};

export default function CivicsMcqPracticePage() {
  return <CivicsMcqPracticeLoader />;
}
