import type { Metadata } from "next";
import { ChemistryOpenPracticeLoader } from "@/components/abiturient/chemistry/ChemistryOpenPracticeLoader";

export const metadata: Metadata = {
  title: "ღია დავალება — სავარჯიშო",
  description:
    "უპასუხე ეროვნული გამოცდის ქიმიის ღია დავალებას — ფორმულა, განტოლება ან გამოთვლა — და მიიღე AI შეფასება შეფასების სქემის კრიტერიუმებით.",
  alternates: { canonical: "/subject/chemistry/open-practice" },
};

export default function ChemistryOpenPracticePage() {
  return <ChemistryOpenPracticeLoader />;
}
