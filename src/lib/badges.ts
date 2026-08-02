export interface Badge {
  id: string;
  icon: string;
  color: "purple" | "cyan" | "green" | "amber" | "gray";
  name: string;
  unlocked: boolean;
  requirement?: string;
}

export const DEFAULT_BADGES: Badge[] = [
  { id: "streak_7", icon: "🔥", color: "purple", name: "7 დღის სტრიქი", unlocked: true },
  { id: "quiz_master", icon: "🧠", color: "cyan", name: "Quiz მასტერი", unlocked: true },
  { id: "first_plan", icon: "✅", color: "green", name: "პირველი გეგმა", unlocked: true },
  { id: "sessions_50", icon: "⭐", color: "amber", name: "50 სესია", unlocked: true },
  {
    id: "streak_30",
    icon: "🔒",
    color: "gray",
    name: "30 სტრიქი",
    unlocked: false,
    requirement: "18 სტრიქი გჭირდება",
  },
  {
    id: "quiz_100",
    icon: "🔒",
    color: "gray",
    name: "100% Quiz",
    unlocked: false,
    requirement: "ერთ Quiz-ში 100%",
  },
  {
    id: "all_subjects",
    icon: "🔒",
    color: "gray",
    name: "ყველა საგანი",
    unlocked: false,
    requirement: "ყველა საგანი ისწავლე",
  },
  {
    id: "mock_exam",
    icon: "🔒",
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
