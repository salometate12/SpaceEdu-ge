import type { LucideIcon } from "lucide-react";
import { SUBJECT_HUB_IDS, SUBJECT_HUB_REGISTRY } from "@/lib/abiturient-subject-hub";
import type { SubjectTheme } from "@/lib/abiturient-subjects";

export interface StudyPlanSubjectOption {
  id: string;
  title: string;
  icon: LucideIcon;
  theme: SubjectTheme;
  suggestedTopics: string[];
}

/**
 * A handful of representative, exam-relevant topics per subject — quick-tap
 * suggestions so abiturients don't have to type out their whole syllabus by
 * hand. They can still add their own on top of these.
 */
const SUGGESTED_TOPICS: Record<string, string[]> = {
  history: [
    "საქართველოს გაერთიანება",
    "ოქროს ხანა",
    "რუსეთის ანექსია",
    "საბჭოთა პერიოდი",
    "დამოუკიდებლობის აღდგენა",
    "მსოფლიო ომები",
  ],
  english: [
    "Grammar Tenses",
    "Reading Comprehension",
    "Vocabulary Building",
    "Essay Writing",
    "Listening Skills",
  ],
  math: [
    "ალგებრული გამოსახულებები",
    "კვადრატული განტოლებები",
    "გეომეტრია",
    "ფუნქციები",
    "ალბათობა და სტატისტიკა",
    "წარმოებულები",
  ],
  georgian: [
    "ვეფხისტყაოსანი",
    "რუსთაველის ეპოქა",
    "XIX საუკუნის ლიტერატურა",
    "თანამედროვე პროზა",
    "სინტაქსი და პუნქტუაცია",
    "თხზულების წერა",
  ],
  geography: [
    "საქართველოს რელიეფი",
    "კლიმატი და ჰავა",
    "მოსახლეობა",
    "ეკონომიკური გეოგრაფია",
    "მსოფლიო ოკეანეები",
    "გლობალური პრობლემები",
  ],
  civics: [
    "საქართველოს კონსტიტუცია",
    "ადამიანის უფლებები",
    "სახელმწიფო მოწყობა",
    "არჩევნები და დემოკრატია",
    "სამოქალაქო საზოგადოება",
  ],
};

/** Same subjects abiturients already see across the app (locked ones excluded — nothing to plan for yet). */
export const STUDY_PLAN_SUBJECTS: StudyPlanSubjectOption[] = SUBJECT_HUB_IDS.filter(
  (id) => !SUBJECT_HUB_REGISTRY[id].locked,
).map((id) => {
  const meta = SUBJECT_HUB_REGISTRY[id];
  return {
    id,
    title: meta.title,
    icon: meta.icon,
    theme: meta.theme,
    suggestedTopics: SUGGESTED_TOPICS[id] ?? [],
  };
});
