import type { Metadata } from "next";
import { EssayTopicPracticeLoader } from "@/components/abiturient/georgian/EssayTopicPracticeLoader";

export const metadata: Metadata = {
  title: "წერითი დავალება — სავარჯიშო",
  description:
    "დაწერე თემა ერთიანი ეროვნული გამოცდების წინა წლების რეალურ დავალებაზე და მიიღე AI შეფასება რუბრიკის მიხედვით.",
  alternates: { canonical: "/subject/georgian/essay-practice" },
};

export default function GeorgianEssayPracticePage() {
  return <EssayTopicPracticeLoader />;
}
