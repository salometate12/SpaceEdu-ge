import type { Metadata } from "next";
import { MathMcqPracticeLoader } from "@/components/abiturient/math/MathMcqPracticeLoader";

export const metadata: Metadata = {
  title: "ტესტური კითხვები — სავარჯიშო",
  description:
    "ივარჯიშე ეროვნული გამოცდის ტესტურ კითხვებზე — წინა წლების რეალური მათემატიკის ვარიანტებიდან, მყისიერი შემოწმებით.",
  alternates: { canonical: "/subject/math/mcq-practice" },
};

export default function MathMcqPracticePage() {
  return <MathMcqPracticeLoader />;
}
