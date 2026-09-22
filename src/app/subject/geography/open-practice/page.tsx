import type { Metadata } from "next";
import { GeographyOpenPracticeLoader } from "@/components/abiturient/geography/GeographyOpenPracticeLoader";

export const metadata: Metadata = {
  title: "ღია დავალება — სავარჯიშო",
  description:
    "უპასუხე ეროვნული გამოცდის გეოგრაფიის ღია დავალებას — წინა წლების რეალური ვარიანტებიდან — და მიიღე AI შეფასება შეფასების სქემის კრიტერიუმებით.",
  alternates: { canonical: "/subject/geography/open-practice" },
};

export default function GeographyOpenPracticePage() {
  return <GeographyOpenPracticeLoader />;
}
