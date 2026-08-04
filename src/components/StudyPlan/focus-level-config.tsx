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
    iconWrap: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
    accent: "border-l-orange-400 dark:border-l-orange-500/60",
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
    iconWrap: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    accent: "border-l-emerald-400 dark:border-l-emerald-500/60",
  },
};
