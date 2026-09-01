import { BookOpen, Flame, RotateCcw, type LucideIcon } from "lucide-react";

export type FocusLevel = "high" | "medium" | "review";

interface FocusLevelConfig {
  label: string;
  icon: LucideIcon;
  iconWrap: string;
  accent: string;
  /**
   * Solid background classes for the same accent color, meant for an
   * absolutely-positioned strip inside an `overflow-hidden` rounded
   * container (rather than a `border-l-4`/`border-t-4` side border).
   * A thick single-side border on a rounded corner renders with a visible
   * kink where it meets the thinner/absent border on the adjacent side —
   * clipping a plain background strip to the container's own radius via
   * `overflow-hidden` avoids that artifact entirely.
   */
  bar: string;
}

export const FOCUS_LEVEL_CONFIG: Record<FocusLevel, FocusLevelConfig> = {
  high: {
    label: "ინტენსიური",
    icon: Flame,
    iconWrap: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
    accent: "border-l-violet-400 dark:border-l-violet-500/60",
    bar: "bg-violet-400 dark:bg-violet-500/60",
  },
  medium: {
    label: "საშუალო",
    icon: BookOpen,
    iconWrap: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
    accent: "border-l-sky-400 dark:border-l-sky-500/60",
    bar: "bg-sky-400 dark:bg-sky-500/60",
  },
  review: {
    label: "გამეორება",
    icon: RotateCcw,
    iconWrap: "bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300",
    accent: "border-l-pink-400 dark:border-l-pink-500/60",
    bar: "bg-pink-400 dark:bg-pink-500/60",
  },
};
