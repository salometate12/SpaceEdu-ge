import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calculator,
  FlaskConical,
  Globe2,
  Landmark,
  Languages,
  ScrollText,
} from "lucide-react";
import { SUBJECT_THEMES, type SubjectTheme } from "./abiturient-subjects";

export interface SubjectHubMeta {
  id: string;
  title: string;
  answered: number;
  total: number;
  icon: LucideIcon;
  theme: SubjectTheme;
  locked?: boolean;
  deckId?: string;
}

export const SUBJECT_HUB_REGISTRY: Record<string, SubjectHubMeta> = {
  history: {
    id: "history",
    title: "ისტორია",
    answered: 164,
    total: 2178,
    icon: ScrollText,
    theme: SUBJECT_THEMES.history,
    deckId: "history-2026",
  },
  english: {
    id: "english",
    title: "ინგლისური",
    answered: 4,
    total: 254,
    icon: Languages,
    theme: SUBJECT_THEMES.english,
  },
  math: {
    id: "math",
    title: "მათემატიკა",
    answered: 38,
    total: 412,
    icon: Calculator,
    theme: SUBJECT_THEMES.math,
    deckId: "mathematics-2026",
  },
  georgian: {
    id: "georgian",
    title: "ქართული ენა",
    answered: 12,
    total: 198,
    icon: BookOpen,
    theme: SUBJECT_THEMES.georgian,
  },
  geography: {
    id: "geography",
    title: "გეოგრაფია",
    answered: 0,
    total: 320,
    icon: Globe2,
    theme: SUBJECT_THEMES.geography,
    deckId: "geography-2026",
  },
  civics: {
    id: "civics",
    title: "სამოქალაქო განათლება",
    answered: 0,
    total: 280,
    icon: Landmark,
    theme: SUBJECT_THEMES.civics,
    deckId: "civic-2026",
  },
  chemistry: {
    id: "chemistry",
    title: "ქიმია",
    answered: 0,
    total: 0,
    icon: FlaskConical,
    theme: SUBJECT_THEMES.chemistry,
    locked: true,
  },
};

export const SUBJECT_HUB_IDS = Object.keys(SUBJECT_HUB_REGISTRY);

export function getSubjectHub(id: string): SubjectHubMeta | null {
  return SUBJECT_HUB_REGISTRY[id] ?? null;
}
