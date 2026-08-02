import {
  Atom,
  BookOpen,
  Calculator,
  Dna,
  FlaskConical,
  Globe,
  Landmark,
  LayoutGrid,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { categoryLabels } from "@/lib/mockData";
import { ka } from "@/lib/i18n";
import type { DeckCategory } from "@/lib/types";

const CATEGORY_ICONS: Record<Exclude<DeckCategory, "all">, LucideIcon> = {
  history: Landmark,
  geography: Globe,
  georgian: BookOpen,
  civic: Scale,
  biology: Dna,
  chemistry: FlaskConical,
  physics: Atom,
  math: Calculator,
};

export interface CategoryNavItem {
  value: DeckCategory;
  label: string;
  icon: LucideIcon;
}

export const categoryNavItems: CategoryNavItem[] = [
  { value: "all", label: ka.nav.all, icon: LayoutGrid },
  ...(
    Object.entries(categoryLabels) as [
      Exclude<DeckCategory, "all">,
      string,
    ][]
  ).map(([value, label]) => ({
    value,
    label,
    icon: CATEGORY_ICONS[value],
  })),
];
