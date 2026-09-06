import {
  BarChart3,
  Brain,
  BookMarked,
  Calculator,
  FileSearch,
  LayoutDashboard,
  Library,
  MessageSquare,
  Settings,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import { researchPlatformHref } from "@/lib/space-back-navigation";
import {
  ABITURIENT_LAST_ACTIVE,
  ABITURIENT_SUBJECTS,
} from "@/lib/abiturient-subjects";

export const ABIT_LIBRARY_ANCHOR = "/dashboard-abit#abit-library";
export const ABIT_SUMMER_READING_ANCHOR = "/dashboard-abit#abit-summer-reading";

export interface AbitMenuItem {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
  /** Non-navigation actions the consumer wires up. */
  action?: "ai-chat";
}

export interface AbitMenuGroup {
  title: string;
  items: AbitMenuItem[];
}

/** The abiturient dashboard's side menu — tuned for the abiturient space:
 * general links, the student's own active subjects, the abiturient tools,
 * then the account section. Shared by the desktop rail and the mobile
 * drawer. */
export function abiturientMenuGroups(): AbitMenuGroup[] {
  const subjectItems: AbitMenuItem[] = [
    ABITURIENT_LAST_ACTIVE,
    ...ABITURIENT_SUBJECTS.filter((s) => s.kind === "active"),
  ]
    .filter(
      (subject, index, all) =>
        all.findIndex((other) => other.id === subject.id) === index,
    )
    .map((subject) => ({
      id: `subject-${subject.id}`,
      label: subject.title,
      href: subject.href,
      icon: subject.icon,
    }));

  return [
    {
      title: "ზოგადი",
      items: [
        { id: "dashboard", label: "დეშბორდი", href: "/dashboard-abit", icon: LayoutDashboard },
        { id: "quiz", label: "ვიქტორინა", href: "/quiz", icon: Brain },
        { id: "profile", label: "პროფილი", href: "/profile-abiturient", icon: User },
      ],
    },
    {
      title: "საგნები",
      items: subjectItems,
    },
    {
      title: "ხელსაწყოები",
      items: [
        { id: "conspectus", label: "AI კონსპექტი", href: "/lit-assistant", icon: Sparkles },
        { id: "quiz-tool", label: "ინტერაქციული ვიქტორინა", href: "/quiz", icon: Brain },
        { id: "calculator", label: "კალკულატორი", href: "/exam-calculator", icon: Calculator },
        {
          id: "research",
          label: "მასალა → ანალიზი",
          href: researchPlatformHref("abit"),
          icon: FileSearch,
        },
        { id: "ai-chat", label: "AI ჩატი", icon: MessageSquare, action: "ai-chat" },
        {
          id: "library",
          label: "სასწავლო ბიბლიოთეკა",
          href: ABIT_LIBRARY_ANCHOR,
          icon: Library,
        },
        {
          id: "summer-reading",
          label: "საზაფხულო საკითხავი",
          href: ABIT_SUMMER_READING_ANCHOR,
          icon: BookMarked,
        },
      ],
    },
    {
      title: "ანგარიში",
      items: [
        { id: "stats", label: "სტატისტიკა", href: "/profile-abiturient/stats", icon: BarChart3 },
        { id: "settings", label: "პარამეტრები", href: "/settings", icon: Settings },
      ],
    },
  ];
}
