import {
  BookOpen,
  Brain,
  CalendarClock,
  FileSearch,
  ListChecks,
  MessageSquareText,
  Sparkles,
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
  /** The icon tile: background and stroke, light / dark. */
  tile: { bg: string; fg: string; darkBg: string; darkFg: string };
}

export const STUDENT_TOOLS: StudentTool[] = [
  {
    id: "study-plan",
    title: "სასწავლო გეგმა",
    description: "დაგეგმე სწავლა საგნების მიხედვით და მიჰყევი დღიდან დღემდე",
    href: "/study-plan",
    icon: CalendarClock,
    accent: STUDENT_TOOL_ACCENTS.studyPlan,
    tile: { bg: "#fdf2f8", fg: "#db2777", darkBg: "rgba(236,72,153,.14)", darkFg: "#f472b6" },
  },
  {
    id: "quiz",
    title: "ვიქტორინა",
    description: "ატვირთე PDF ან ფაილი და მიიღე ქვიზი",
    href: "/quiz",
    icon: Brain,
    accent: STUDENT_TOOL_ACCENTS.quiz,
    tile: { bg: "#f0fdfa", fg: "#0f766e", darkBg: "rgba(45,212,191,.12)", darkFg: "#5eead4" },
  },
  {
    id: "ai-teacher",
    title: "AI მასწავლებელი",
    description: "ვერ გაიგე თემა? ჰკითხე და აგიხსნის",
    href: "/ai-teacher",
    icon: MessageSquareText,
    accent: STUDENT_TOOL_ACCENTS.aiTeacher,
    tile: { bg: "#f0fdf4", fg: "#15803d", darkBg: "rgba(74,222,128,.12)", darkFg: "#86efac" },
  },
  {
    id: "journal",
    title: "ციფრული ჟურნალი",
    description: "ლექციების ჩანაწერები ერთ ადგილას",
    href: "/journal",
    icon: BookOpen,
    accent: STUDENT_TOOL_ACCENTS.journal,
    tile: { bg: "#fef2f2", fg: "#dc2626", darkBg: "rgba(248,113,113,.12)", darkFg: "#fca5a5" },
  },
  {
    id: "presentation",
    title: "AI პრეზენტაცია",
    description: "თემიდან მზა სლაიდები წუთებში",
    href: "/presentation",
    icon: Sparkles,
    accent: STUDENT_TOOL_ACCENTS.presentation,
    tile: { bg: "#fff7ed", fg: "#c2410c", darkBg: "rgba(251,146,60,.12)", darkFg: "#fdba74" },
  },
  {
    id: "research",
    title: "მასალის ანალიზი",
    description: "ატვირთე მასალა, მიიღე მთავარი აზრები",
    href: researchPlatformHref("student"),
    icon: FileSearch,
    accent: STUDENT_TOOL_ACCENTS.research,
    tile: { bg: "#fff1f2", fg: "#e11d48", darkBg: "rgba(251,113,133,.12)", darkFg: "#fda4af" },
  },
  {
    id: "eli5",
    title: "ELI5 ახსნა",
    description: "რთული თემა ისე, რომ ბავშვსაც გაეგება",
    href: "/eli5",
    icon: ListChecks,
    accent: STUDENT_TOOL_ACCENTS.eli5,
    tile: { bg: "#eff6ff", fg: "#1d4ed8", darkBg: "rgba(96,165,250,.12)", darkFg: "#93c5fd" },
  },
];
