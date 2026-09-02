export interface NeonSubjectAccent {
  /** Primary hex for progress fill & icon */
  accent: string;
  /** RGBA for box-shadow glow */
  glow: string;
  /** Tailwind `before:` gradient class for hover wash */
  gradientBeforeClass: string;
  /** Tailwind class for icon tint */
  iconClass: string;
}

/** Neon-Cyber color identity per subject (dashboard cards). */
export const NEON_SUBJECT_ACCENTS: Record<string, NeonSubjectAccent> = {
  history: {
    accent: "#a855f7",
    glow: "rgba(168, 85, 247, 0.45)",
    gradientBeforeClass: "before:from-purple-400/30 dark:before:from-purple-500/20",
    iconClass: "text-purple-600 dark:text-purple-400",
  },
  math: {
    accent: "#06b6d4",
    glow: "rgba(6, 182, 212, 0.45)",
    gradientBeforeClass: "before:from-cyan-400/30 dark:before:from-cyan-500/20",
    iconClass: "text-cyan-600 dark:text-cyan-400",
  },
  english: {
    accent: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.45)",
    gradientBeforeClass: "before:from-amber-400/30 dark:before:from-amber-500/20",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  georgian: {
    accent: "#f43f5e",
    glow: "rgba(244, 63, 94, 0.45)",
    gradientBeforeClass: "before:from-rose-400/30 dark:before:from-rose-500/20",
    iconClass: "text-rose-600 dark:text-rose-400",
  },
  geography: {
    accent: "#10b981",
    glow: "rgba(16, 185, 129, 0.4)",
    gradientBeforeClass: "before:from-emerald-400/30 dark:before:from-emerald-500/20",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  civics: {
    accent: "#818cf8",
    glow: "rgba(129, 140, 248, 0.4)",
    gradientBeforeClass: "before:from-indigo-400/30 dark:before:from-indigo-500/20",
    iconClass: "text-indigo-600 dark:text-indigo-400",
  },
  chemistry: {
    accent: "#94a3b8",
    glow: "rgba(148, 163, 184, 0.25)",
    gradientBeforeClass: "before:from-slate-400/25 dark:before:from-slate-500/15",
    iconClass: "text-slate-600 dark:text-slate-400",
  },
};

export function getNeonAccent(subjectId: string): NeonSubjectAccent {
  return (
    NEON_SUBJECT_ACCENTS[subjectId] ?? {
      accent: "#a855f7",
      glow: "rgba(168, 85, 247, 0.4)",
      gradientBeforeClass: "before:from-purple-400/30 dark:before:from-purple-500/20",
      iconClass: "text-purple-600 dark:text-purple-400",
    }
  );
}

/** Accent colors for dashboard tool cards (same hover glow as subjects). */
export const DASHBOARD_TOOL_ACCENTS = {
  conspectus: NEON_SUBJECT_ACCENTS.history,
  quiz: NEON_SUBJECT_ACCENTS.math,
  calculator: NEON_SUBJECT_ACCENTS.geography,
  research: NEON_SUBJECT_ACCENTS.georgian,
} as const satisfies Record<string, NeonSubjectAccent>;

/** Accent colors for student workspace tool cards. */
export const STUDENT_TOOL_ACCENTS = {
  studyPlan: NEON_SUBJECT_ACCENTS.history,
  quiz: NEON_SUBJECT_ACCENTS.math,
  aiTeacher: NEON_SUBJECT_ACCENTS.geography,
  presentation: NEON_SUBJECT_ACCENTS.english,
  research: NEON_SUBJECT_ACCENTS.georgian,
  eli5: NEON_SUBJECT_ACCENTS.civics,
  lectureNotes: NEON_SUBJECT_ACCENTS.english,
  journal: NEON_SUBJECT_ACCENTS.georgian,
} as const satisfies Record<string, NeonSubjectAccent>;

export const DASHBOARD_LIBRARY_ACCENTS = {
  textbook: NEON_SUBJECT_ACCENTS.history,
  summer: NEON_SUBJECT_ACCENTS.geography,
} as const satisfies Record<string, NeonSubjectAccent>;
