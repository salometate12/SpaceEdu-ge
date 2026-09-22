import type { Metadata } from "next";
import { HistoryReadingPracticeLoader } from "@/components/abiturient/history/HistoryReadingPracticeLoader";

export const metadata: Metadata = {
  title: "წაკითხულის გააზრება — სავარჯიშო",
  description:
    "ივარჯიშე ისტორიის ტესტურ კითხვებზე — წინა წლების რეალური გამოცდის ვარიანტებიდან, მყისიერი შემოწმებითა და ახსნით.",
  alternates: { canonical: "/subject/history/reading-comprehension" },
};

export default function HistoryReadingComprehensionPage() {
  return <HistoryReadingPracticeLoader />;
}
