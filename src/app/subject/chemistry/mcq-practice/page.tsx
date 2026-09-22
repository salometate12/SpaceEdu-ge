import type { Metadata } from "next";
import { ChemistryMcqPracticeLoader } from "@/components/abiturient/chemistry/ChemistryMcqPracticeLoader";

export const metadata: Metadata = {
  title: "ტესტური კითხვები — სავარჯიშო",
  description:
    "ივარჯიშე ეროვნული გამოცდის ქიმიის ტესტურ კითხვებზე — წინა წლების რეალური ვარიანტებიდან, მყისიერი შემოწმებით.",
  alternates: { canonical: "/subject/chemistry/mcq-practice" },
};

export default function ChemistryMcqPracticePage() {
  return <ChemistryMcqPracticeLoader />;
}
