import {
  Award,
  BrainCircuit,
  CheckCircle2,
  Flame,
  Lock,
  type LucideIcon,
} from "lucide-react";

export interface Badge {
  id: string;
  icon: LucideIcon;
  color: "purple" | "cyan" | "green" | "amber" | "gray";
  name: string;
  unlocked: boolean;
  requirement?: string;
}

export const DEFAULT_BADGES: Badge[] = [
  { id: "streak_7", icon: Flame, color: "purple", name: "7 დღის სტრიქი", unlocked: true },
  { id: "quiz_master", icon: BrainCircuit, color: "cyan", name: "Quiz მასტერი", unlocked: true },
  { id: "first_plan", icon: CheckCircle2, color: "green", name: "პირველი გეგმა", unlocked: true },
  { id: "sessions_50", icon: Award, color: "amber", name: "50 სესია", unlocked: true },
  {
    id: "streak_30",
    icon: Lock,
    color: "gray",
    name: "30 სტრიქი",
    unlocked: false,
    requirement: "18 სტრიქი გჭირდება",
  },
  {
    id: "quiz_100",
    icon: Lock,
    color: "gray",
    name: "100% Quiz",
    unlocked: false,
    requirement: "ერთ Quiz-ში 100%",
  },
  {
    id: "all_subjects",
    icon: Lock,
    color: "gray",
    name: "ყველა საგანი",
    unlocked: false,
    requirement: "ყველა საგანი ისწავლე",
  },
  {
    id: "mock_exam",
    icon: Lock,
    color: "gray",
    name: "Mock Exam",
    unlocked: false,
    requirement: "Mock Exam გაიარე",
  },
];

export function getBadgeColor(color: Badge["color"]): string {
  switch (color) {
    case "purple":
      return "var(--accent-purple)";
    case "cyan":
      return "var(--accent-cyan)";
    case "green":
      return "var(--accent-green)";
    case "amber":
      return "var(--accent-amber)";
    default:
      return "var(--text-secondary)";
  }
}
