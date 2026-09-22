import type { Metadata } from "next";
import { HistoryWritingPracticeLoader } from "@/components/abiturient/history/HistoryWritingPracticeLoader";

export const metadata: Metadata = {
  title: "წერითი დავალება — სავარჯიშო",
  description:
    "უპასუხე ისტორიის წყაროზე დაფუძნებულ ღია დავალებას — წინა წლების რეალური გამოცდიდან — და მიიღე AI შეფასება შეფასების სქემის კრიტერიუმებით.",
  alternates: { canonical: "/subject/history/essay-practice" },
};

export default function HistoryEssayPracticePage() {
  return <HistoryWritingPracticeLoader />;
}
