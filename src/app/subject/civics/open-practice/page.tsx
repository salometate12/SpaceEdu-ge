import type { Metadata } from "next";
import { CivicsOpenPracticeLoader } from "@/components/abiturient/civics/CivicsOpenPracticeLoader";

export const metadata: Metadata = {
  title: "ღია დავალება — სავარჯიშო",
  description:
    "უპასუხე ეროვნული გამოცდის სამოქალაქო განათლების ღია დავალებას და მიიღე AI შეფასება შეფასების სქემის კრიტერიუმებით.",
  alternates: { canonical: "/subject/civics/open-practice" },
};

export default function CivicsOpenPracticePage() {
  return <CivicsOpenPracticeLoader />;
}
