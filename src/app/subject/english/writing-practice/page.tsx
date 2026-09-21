import type { Metadata } from "next";
import { EnglishWritingPracticeLoader } from "@/components/abiturient/english/EnglishWritingPracticeLoader";

export const metadata: Metadata = {
  title: "წერითი დავალება — სავარჯიშო",
  description:
    "დაწერე ინგლისურის ესე ეროვნული გამოცდის რეალურ თემაზე და მიიღე AI შეფასება ოფიციალური კრიტერიუმებით — შინაარსი, ორგანიზება, ლექსიკა და გრამატიკა.",
  alternates: { canonical: "/subject/english/writing-practice" },
};

export default function EnglishWritingPracticePage() {
  return <EnglishWritingPracticeLoader />;
}
