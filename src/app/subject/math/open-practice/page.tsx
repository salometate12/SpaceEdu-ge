import type { Metadata } from "next";
import { MathOpenPracticeLoader } from "@/components/abiturient/math/MathOpenPracticeLoader";

export const metadata: Metadata = {
  title: "ღია ამოცანა — სავარჯიშო",
  description:
    "ამოხსენი ეროვნული გამოცდის ღია ამოცანა — წინა წლების რეალური მათემატიკის ვარიანტებიდან — და მიიღე ეტაპობრივი AI შეფასება.",
  alternates: { canonical: "/subject/math/open-practice" },
};

export default function MathOpenPracticePage() {
  return <MathOpenPracticeLoader />;
}
