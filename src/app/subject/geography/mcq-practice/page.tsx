import type { Metadata } from "next";
import { GeographyMcqPracticeLoader } from "@/components/abiturient/geography/GeographyMcqPracticeLoader";

export const metadata: Metadata = {
  title: "ტესტური კითხვები — სავარჯიშო",
  description:
    "ივარჯიშე ეროვნული გამოცდის გეოგრაფიის ტესტურ კითხვებზე — წინა წლების რეალური ვარიანტებიდან, რუკებით და დიაგრამებით, მყისიერი შემოწმებით.",
  alternates: { canonical: "/subject/geography/mcq-practice" },
};

export default function GeographyMcqPracticePage() {
  return <GeographyMcqPracticeLoader />;
}
