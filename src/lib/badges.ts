import type { LucideIcon } from "lucide-react";

export interface Badge {
  id: string;
  icon: LucideIcon;
  color: "purple" | "cyan" | "green" | "amber" | "gray";
  name: string;
  unlocked: boolean;
  requirement?: string;
}

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
