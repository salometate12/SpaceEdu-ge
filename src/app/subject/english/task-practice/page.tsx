import type { Metadata } from "next";
import { EnglishTaskPracticeLoader } from "@/components/abiturient/english/EnglishTaskPracticeLoader";

export const metadata: Metadata = {
  title: "ტესტური დავალებები — სავარჯიშო",
  description:
    "ივარჯიშე ეროვნული გამოცდის ინგლისურის ტესტურ დავალებებზე — მოსმენა, კითხვა, ლექსიკა და გრამატიკა წინა წლების რეალური ვარიანტებიდან, მყისიერი შემოწმებით.",
  alternates: { canonical: "/subject/english/task-practice" },
};

export default function EnglishTaskPracticePage() {
  return <EnglishTaskPracticeLoader />;
}
