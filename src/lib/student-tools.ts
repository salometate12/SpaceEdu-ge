import {
  BookOpen,
  Brain,
  CalendarClock,
  FileSearch,
  ListChecks,
  MessageSquareText,
  Sparkles,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import { researchPlatformHref } from "@/lib/space-back-navigation";
import { STUDENT_TOOL_ACCENTS, type NeonSubjectAccent } from "@/lib/abiturient-neon-accents";

export interface StudentTool {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: NeonSubjectAccent;
}

export const STUDENT_TOOLS: StudentTool[] = [
  {
    id: "study-plan",
    title: "სასწავლო გეგმა",
    description: "AI-ით გენ. გეგმები Calendar View-ით",
    href: "/study-plan",
    icon: CalendarClock,
    accent: STUDENT_TOOL_ACCENTS.studyPlan,
  },
  {
    id: "quiz",
    title: "ვიქტორინა",
    description: "კითხვები კონსპექტიდან და ტექსტიდან",
    href: "/quiz",
    icon: Brain,
    accent: STUDENT_TOOL_ACCENTS.quiz,
  },
  {
    id: "ai-teacher",
    title: "AI მასწავლებელი",
    description: "ინტერაქტიური ჩატი თემით და კონსპექტით",
    href: "/ai-teacher",
    icon: MessageSquareText,
    accent: STUDENT_TOOL_ACCENTS.aiTeacher,
  },
  {
    id: "lecture-notes",
    title: "ლექციის ნოტები",
    description: "ცოცხალი ჩანაწერი, AI საკვანძო თემები და სტიკერი დეშბორდზე",
    href: "/lecture-notes",
    icon: StickyNote,
    accent: STUDENT_TOOL_ACCENTS.lectureNotes,
  },
  {
    id: "journal",
    title: "ციფრული ჟურნალი",
    description: "ღია რვეული: ლექციები, დავალებები, AI ნოტები და იდეები",
    href: "/journal",
    icon: BookOpen,
    accent: STUDENT_TOOL_ACCENTS.journal,
  },
  {
    id: "presentation",
    title: "AI პრეზენტაცია",
    description: "4-step wizard, templates, PPTX/PDF",
    href: "/presentation",
    icon: Sparkles,
    accent: STUDENT_TOOL_ACCENTS.presentation,
  },
  {
    id: "research",
    title: "მასალა → ანალიზი",
    description: "PDF, ფოტო, ტექსტი, აუდიო — ერთად გაანალიზე",
    href: researchPlatformHref("student"),
    icon: FileSearch,
    accent: STUDENT_TOOL_ACCENTS.research,
  },
  {
    id: "eli5",
    title: "ELI5 ახსნა",
    description: "რთული კონცეფციები — მარტივ ენაზე",
    href: "/eli5",
    icon: ListChecks,
    accent: STUDENT_TOOL_ACCENTS.eli5,
  },
];
