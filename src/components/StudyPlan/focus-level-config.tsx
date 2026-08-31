import { BookOpen, Flame, RotateCcw, type LucideIcon } from "lucide-react";

export type FocusLevel = "high" | "medium" | "review";

interface FocusLevelConfig {
  label: string;
  icon: LucideIcon;
  iconWrap: string;
  accent: string;
}

export const FOCUS_LEVEL_CONFIG: Record<FocusLevel, FocusLevelConfig> = {
  high: {
    label: "ინტენსიური",
    icon: Flame,
    iconWrap: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
    accent: "border-l-violet-400 dark:border-l-violet-500/60",
  },
  medium: {
    label: "საშუალო",
    icon: BookOpen,
    iconWrap: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
    accent: "border-l-sky-400 dark:border-l-sky-500/60",
  },
  review: {
    label: "გამეორება",
    icon: RotateCcw,
    iconWrap: "bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300",
    accent: "border-l-pink-400 dark:border-l-pink-500/60",
  },
};
