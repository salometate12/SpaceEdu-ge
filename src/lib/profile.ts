import type { LucideIcon } from "lucide-react";

export type UserSpace = "school" | "abiturient" | "student";

export interface UserProfile {
  name: string;
  initials: string;
  space: UserSpace;
  joinDate: string;
  totalSessions: number;
  currentStreak: number;
  badges: number;
  avgQuizScore: number;
  weekSessions: number;
  weekDiff: number;
  examDate: string;
  quizImprovement: number;
  personalBestStreak: number;
}

export interface SubjectProgress {
  name: string;
  icon: LucideIcon;
  color: string;
  progress: number;
  quizzesDone: number;
  lastStudied: string;
}

export type DiaryType =
  | "quiz"
  | "study_plan"
  | "ai_chat"
  | "notes"
  | "presentation";

export interface DiaryEntry {
  id: string;
  type: DiaryType;
  title: string;
  detail: string;
  timestamp: string;
  color: string;
}

export type GoalCategory = "study" | "read" | "task" | "other";

export interface DailyGoal {
  id: string;
  text: string;
  done: boolean;
  type: GoalCategory;
  /** The day it's for (YYYY-MM-DD, local). */
  date: string;
  /** Optional time it takes, in minutes. */
  minutes?: number;
  /** The suggestion it came from („plan:…“, „deadline:…“), so it isn't offered again. */
  source?: string;
}

export { DASHBOARD_GOALS_KEY as DASHBOARD_GOALS_STORAGE_KEY } from "@/lib/user-data-keys";

const SPACE_LABEL: Record<UserSpace, string> = {
  school: "სკოლა",
  abiturient: "აბიტურიენტი",
  student: "სტუდენტი",
};

export function getSpaceLabel(space: UserSpace): string {
  return SPACE_LABEL[space];
}

/**
 * Days remaining until the user's exam date. Never negative — once the
 * exam date has passed we treat it as "0" so the UI can show a
 * congratulatory / reset state instead of a nonsensical countdown.
 */
export function getDaysUntilExam(examDate: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
}
