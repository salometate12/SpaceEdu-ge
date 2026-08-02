import { Calculator, Database, Settings, Sparkles } from "lucide-react";
import type { AdminSectionId } from "./types";

export interface AdminNavItem {
  id: AdminSectionId;
  label: string;
  description: string;
  icon: typeof Database;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: "calculator",
    label: "Calculator Data",
    description: "University handbook thresholds and slots",
    icon: Calculator,
  },
  {
    id: "quiz",
    label: "Quiz Manager",
    description: "Quizzes and learning materials",
    icon: Sparkles,
  },
  {
    id: "settings",
    label: "System Settings",
    description: "AI keys and platform configuration",
    icon: Settings,
  },
];

export const DEFAULT_ADMIN_SECTION: AdminSectionId = "calculator";

export function isAdminSectionId(value: string | null): value is AdminSectionId {
  return value === "calculator" || value === "quiz" || value === "settings";
}
