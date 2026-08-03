import type { LucideIcon } from "lucide-react";

export function subjectHubHref(id: string) {
  return `/subject/${id}`;
}
import {
  BookOpen,
  Calculator,
  FlaskConical,
  Globe2,
  Landmark,
  Languages,
  ScrollText,
} from "lucide-react";

export interface SubjectTheme {
  glow: string;
  progressStroke: string;
  progressLabel: string;
  iconRing: string;
  iconText: string;
  ctaText: string;
  hoverBorder: string;
  badgeBg: string;
}

export const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  history: {
    glow: "#A855F7",
    progressStroke: "stroke-purple-400",
    progressLabel: "text-purple-300",
    iconRing: "border-purple-500/30 bg-purple-500/10",
    iconText: "text-purple-300",
    ctaText: "text-purple-400",
    hoverBorder: "hover:border-purple-500/25",
    badgeBg: "bg-purple-500",
  },
  english: {
    glow: "#F59E0B",
    progressStroke: "stroke-amber-400",
    progressLabel: "text-amber-300",
    iconRing: "border-amber-500/30 bg-amber-500/10",
    iconText: "text-amber-300",
    ctaText: "text-amber-400",
    hoverBorder: "hover:border-amber-500/25",
    badgeBg: "bg-amber-500",
  },
  math: {
    glow: "#06B6D4",
    progressStroke: "stroke-cyan-400",
    progressLabel: "text-cyan-300",
    iconRing: "border-cyan-500/30 bg-cyan-500/10",
    iconText: "text-cyan-300",
    ctaText: "text-cyan-400",
    hoverBorder: "hover:border-cyan-500/25",
    badgeBg: "bg-cyan-500",
  },
  georgian: {
    glow: "#F43F5E",
    progressStroke: "stroke-rose-400",
    progressLabel: "text-rose-300",
    iconRing: "border-rose-500/30 bg-rose-500/10",
    iconText: "text-rose-300",
    ctaText: "text-rose-400",
    hoverBorder: "hover:border-rose-500/25",
    badgeBg: "bg-rose-500",
  },
  geography: {
    glow: "#10B981",
    progressStroke: "stroke-emerald-400",
    progressLabel: "text-emerald-300",
    iconRing: "border-emerald-500/30 bg-emerald-500/10",
    iconText: "text-emerald-300",
    ctaText: "text-emerald-400",
    hoverBorder: "hover:border-emerald-500/25",
    badgeBg: "bg-emerald-500",
  },
  civics: {
    glow: "#818CF8",
    progressStroke: "stroke-indigo-400",
    progressLabel: "text-indigo-300",
    iconRing: "border-indigo-500/30 bg-indigo-500/10",
    iconText: "text-indigo-300",
    ctaText: "text-indigo-400",
    hoverBorder: "hover:border-indigo-500/25",
    badgeBg: "bg-indigo-500",
  },
  chemistry: {
    glow: "#64748B",
    progressStroke: "stroke-slate-400",
    progressLabel: "text-slate-400",
    iconRing: "border-slate-500/25 bg-slate-500/10",
    iconText: "text-slate-400",
    ctaText: "text-slate-500",
    hoverBorder: "hover:border-slate-500/20",
    badgeBg: "bg-slate-500",
  },
};

/**
 * A small playful accent palette used as each subject's *secondary* color —
 * for cards that live alongside the subject's own brand color (from
 * SUBJECT_THEMES) so a subject page isn't just one color repeated on every
 * card. Picked to pair nicely (warm/cool complements) with each subject's
 * primary theme rather than clash with it.
 */
export const ACCENT_PALETTE: Record<string, SubjectTheme> = {
  gold: {
    glow: "#F59E0B",
    progressStroke: "stroke-amber-400",
    progressLabel: "text-amber-300",
    iconRing: "border-amber-500/30 bg-amber-500/10",
    iconText: "text-amber-300",
    ctaText: "text-amber-400",
    hoverBorder: "hover:border-amber-500/25",
    badgeBg: "bg-amber-500",
  },
  sky: {
    glow: "#38BDF8",
    progressStroke: "stroke-sky-400",
    progressLabel: "text-sky-300",
    iconRing: "border-sky-500/30 bg-sky-500/10",
    iconText: "text-sky-300",
    ctaText: "text-sky-400",
    hoverBorder: "hover:border-sky-500/25",
    badgeBg: "bg-sky-500",
  },
  pink: {
    glow: "#F472B6",
    progressStroke: "stroke-pink-400",
    progressLabel: "text-pink-300",
    iconRing: "border-pink-500/30 bg-pink-500/10",
    iconText: "text-pink-300",
    ctaText: "text-pink-400",
    hoverBorder: "hover:border-pink-500/25",
    badgeBg: "bg-pink-500",
  },
  teal: {
    glow: "#2DD4BF",
    progressStroke: "stroke-teal-400",
    progressLabel: "text-teal-300",
    iconRing: "border-teal-500/30 bg-teal-500/10",
    iconText: "text-teal-300",
    ctaText: "text-teal-400",
    hoverBorder: "hover:border-teal-500/25",
    badgeBg: "bg-teal-500",
  },
  lime: {
    glow: "#A3E635",
    progressStroke: "stroke-lime-400",
    progressLabel: "text-lime-300",
    iconRing: "border-lime-500/30 bg-lime-500/10",
    iconText: "text-lime-300",
    ctaText: "text-lime-400",
    hoverBorder: "hover:border-lime-500/25",
    badgeBg: "bg-lime-500",
  },
};

const SUBJECT_SECONDARY_THEMES: Record<string, SubjectTheme> = {
  history: ACCENT_PALETTE.gold,
  english: ACCENT_PALETTE.sky,
  math: ACCENT_PALETTE.pink,
  georgian: ACCENT_PALETTE.gold,
  geography: ACCENT_PALETTE.sky,
  civics: ACCENT_PALETTE.teal,
  chemistry: ACCENT_PALETTE.lime,
};

export function getSecondaryTheme(subjectId: string): SubjectTheme {
  return SUBJECT_SECONDARY_THEMES[subjectId] ?? ACCENT_PALETTE.sky;
}

export interface AbiturientLastActive {
  id: string;
  title: string;
  answered: number;
  total: number;
  percent: number;
  icon: LucideIcon;
  theme: SubjectTheme;
  href: string;
}

export interface AbiturientActiveSubject {
  kind: "active";
  id: string;
  title: string;
  answered: number;
  total: number;
  percent: number;
  icon: LucideIcon;
  imageSrc?: string;
  href: string;
  theme: SubjectTheme;
}

export interface AbiturientNewSubject {
  kind: "new";
  id: string;
  title: string;
  icon: LucideIcon;
  imageSrc?: string;
  href: string;
  theme: SubjectTheme;
}

export interface AbiturientLockedSubject {
  kind: "locked";
  id: string;
  title: string;
  icon: LucideIcon;
  theme: SubjectTheme;
}

export type AbiturientSubjectCard =
  | AbiturientActiveSubject
  | AbiturientNewSubject
  | AbiturientLockedSubject;

export const ABITURIENT_LAST_ACTIVE: AbiturientLastActive = {
  id: "history",
  title: "ისტორია",
  answered: 164,
  total: 2178,
  percent: 8,
  icon: ScrollText,
  theme: SUBJECT_THEMES.history,
  href: subjectHubHref("history"),
};

export const ABITURIENT_SUBJECTS: AbiturientSubjectCard[] = [
  {
    kind: "active",
    id: "english",
    title: "ინგლისური",
    answered: 4,
    total: 254,
    percent: 2,
    icon: Languages,
    imageSrc: "/3d-icons/study-books.png",
    href: subjectHubHref("english"),
    theme: SUBJECT_THEMES.english,
  },
  {
    kind: "active",
    id: "math",
    title: "მათემატიკა",
    answered: 38,
    total: 412,
    percent: 9,
    icon: Calculator,
    imageSrc: "/3d-icons/dashboard-calculator.png",
    href: subjectHubHref("math"),
    theme: SUBJECT_THEMES.math,
  },
  {
    kind: "active",
    id: "georgian",
    title: "ქართული",
    answered: 12,
    total: 198,
    percent: 6,
    icon: BookOpen,
    imageSrc: "/3d-icons/dashboard-pencil-case.png",
    href: subjectHubHref("georgian"),
    theme: SUBJECT_THEMES.georgian,
  },
  {
    kind: "new",
    id: "geography",
    title: "გეოგრაფია",
    icon: Globe2,
    imageSrc: "/3d-icons/dashboard-globe.png",
    href: subjectHubHref("geography"),
    theme: SUBJECT_THEMES.geography,
  },
  {
    kind: "new",
    id: "civics",
    title: "სამოქალაქო განათლება",
    icon: Landmark,
    imageSrc: "/3d-icons/pdf-file.png",
    href: subjectHubHref("civics"),
    theme: SUBJECT_THEMES.civics,
  },
  {
    kind: "locked",
    id: "chemistry",
    title: "ქიმია",
    icon: FlaskConical,
    theme: SUBJECT_THEMES.chemistry,
  },
];
