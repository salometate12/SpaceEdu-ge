import type { PremiumAssistantPath } from "./assistant-routes";

export interface AssistantSidebarConfig {
  route: PremiumAssistantPath;
  guideDescription: string;
  quickPills: readonly string[];
  seedHistory: readonly string[];
}

export const ASSISTANT_SIDEBAR_CONFIG: Record<
  PremiumAssistantPath,
  AssistantSidebarConfig
> = {
  "/lit-assistant": {
    route: "/lit-assistant",
    guideDescription:
      "შეიყვანე ავტორი, ნაწარმოები ან თემა — AI მოიძიებს ვებში და შექმნის კონსპექტს.",
    quickPills: [
      "ვეფხისტყაოსანი",
      "გამზრდელი",
      "ალუდა ქეთელაური",
      "ცისფერი ყანწელები",
    ],
    seedHistory: [
      "ვეფხისტყაოსანი",
      "გამზრდელი",
      "ალუდა ქეთელაური",
      "ცისფერი ყანწელები",
      "შოთა რუსთაველი",
    ],
  },
  "/history-assistant": {
    route: "/history-assistant",
    guideDescription:
      "შეიყვანე ნებისმიერი ისტორიული თემა — AI მოიძიებს ვებში და შექმნის კონსპექტს.",
    quickPills: [
      "დიდგორის ბრძოლა",
      "ცივი ომი",
      "საქართველოს დამოუკიდებლობა",
      "ფეოდალიზმი ევროპაში",
    ],
    seedHistory: [
      "დიდგორის ბრძოლა",
      "ცივი ომი",
      "საქართველოს დამოუკიდებლობა",
      "ფეოდალიზმი ევროპაში",
      "რენესანსი",
    ],
  },
  "/english-assistant": {
    route: "/english-assistant",
    guideDescription:
      "შეიყვანე გრამატიკული წესი, თემა ან ლექსიკა — AI შექმნის სტრუქტურულ კონსპექტს.",
    quickPills: [
      "Conditionals",
      "Inversion rules",
      "Formal Essay Vocabulary",
      "Tenses Overview",
    ],
    seedHistory: [
      "Conditionals",
      "Inversion rules",
      "Formal Essay Vocabulary",
      "Present Perfect vs Past Simple",
      "Academic linking words",
    ],
  },
  "/civics-assistant": {
    route: "/civics-assistant",
    guideDescription:
      "შეიყვანე სამოქალაქო ან სამართლებრივი საკითხი — AI შექმნის დეტალურ კონსპექტს.",
    quickPills: [
      "ადამიანის უფლებები",
      "კონსტიტუცია",
      "სამოქალაქო საზოგადოება",
      "გაეროს სტრუქტურა",
    ],
    seedHistory: [
      "ადამიანის უფლებები",
      "კონსტიტუცია",
      "სამოქალაქო საზოგადოება",
      "დემოკრატია",
      "სამართლებრივი სახელმწიფო",
    ],
  },
};

export function getAssistantSidebarConfig(
  route: PremiumAssistantPath,
): AssistantSidebarConfig {
  return ASSISTANT_SIDEBAR_CONFIG[route];
}
