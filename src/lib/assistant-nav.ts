import type { LucideIcon } from "lucide-react";
import { BookOpen, Compass, Languages, Scale } from "lucide-react";

export type AssistantAccent = "violet" | "amber" | "sky" | "emerald";

export interface AssistantNavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  accent: AssistantAccent;
}

export const ASSISTANT_NAV_ITEMS: AssistantNavItem[] = [
  {
    href: "/lit-assistant",
    label: "ქართული ლიტერატურა",
    shortLabel: "ლიტერატურა",
    icon: BookOpen,
    accent: "violet",
  },
  {
    href: "/history-assistant",
    label: "ისტორიის მკვლევარი",
    shortLabel: "ისტორია",
    icon: Compass,
    accent: "amber",
  },
  {
    href: "/english-assistant",
    label: "ინგლისური ენა",
    shortLabel: "ინგლისური",
    icon: Languages,
    accent: "sky",
  },
  {
    href: "/civics-assistant",
    label: "სამოქალაქო განათლება",
    shortLabel: "სამოქალაქო",
    icon: Scale,
    accent: "emerald",
  },
];

export const assistantNavAccentClasses: Record<
  AssistantAccent,
  { active: string; idle: string; icon: string }
> = {
  violet: {
    active: "bg-violet-600 text-white shadow-sm",
    idle: "text-zinc-600 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:bg-violet-950/40 dark:hover:text-violet-300",
    icon: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    active: "bg-amber-600 text-white shadow-sm",
    idle: "text-zinc-600 hover:bg-amber-50 hover:text-amber-800 dark:text-zinc-400 dark:hover:bg-amber-950/40 dark:hover:text-amber-300",
    icon: "text-amber-600 dark:text-amber-400",
  },
  sky: {
    active: "bg-sky-600 text-white shadow-sm",
    idle: "text-zinc-600 hover:bg-sky-50 hover:text-sky-800 dark:text-zinc-400 dark:hover:bg-sky-950/40 dark:hover:text-sky-300",
    icon: "text-sky-600 dark:text-sky-400",
  },
  emerald: {
    active: "bg-emerald-600 text-white shadow-sm",
    idle: "text-zinc-600 hover:bg-emerald-50 hover:text-emerald-800 dark:text-zinc-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
};
