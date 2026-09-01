import { BookOpen, Dna, FlaskConical, Landmark, type LucideIcon } from "lucide-react";

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

export interface DailyGoal {
  id: string;
  text: string;
  done: boolean;
  type: "quiz" | "study" | "read" | "chat";
}

export const INITIAL_DAILY_GOALS: DailyGoal[] = [
  { id: "goal-1", text: "ბიოლოგიის 1 quiz", done: true, type: "quiz" },
  { id: "goal-2", text: "ქიმიის კონსპექტის გამეორება", done: false, type: "read" },
  { id: "goal-3", text: "AI ჩატი — რთული თემა", done: true, type: "chat" },
  { id: "goal-4", text: "Study plan task #4", done: false, type: "study" },
  { id: "goal-5", text: "ისტორიის მოკლე ტესტი", done: false, type: "quiz" },
];

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

export async function getProfileData(): Promise<{
  user: UserProfile;
  subjects: SubjectProgress[];
  diary: DiaryEntry[];
}> {
  // TODO: Replace with Supabase/Firebase queries from users, progress, activity_log tables.
  return {
    user: {
      name: "სალომე თათეშვილი",
      initials: "სთ",
      space: "abiturient",
      joinDate: "2026-02-03",
      totalSessions: 68,
      currentStreak: 9,
      badges: 4,
      avgQuizScore: 84,
      weekSessions: 6,
      weekDiff: 2,
      examDate: "2027-06-21",
      quizImprovement: 7,
      personalBestStreak: 14,
    },
    subjects: [
      {
        name: "ბიოლოგია",
        icon: Dna,
        color: "var(--accent-green)",
        progress: 78,
        quizzesDone: 21,
        lastStudied: "დღეს",
      },
      {
        name: "ქიმია",
        icon: FlaskConical,
        color: "var(--accent-cyan)",
        progress: 64,
        quizzesDone: 17,
        lastStudied: "გუშინ",
      },
      {
        name: "ისტორია",
        icon: Landmark,
        color: "var(--accent-amber)",
        progress: 52,
        quizzesDone: 13,
        lastStudied: "2 დღის წინ",
      },
      {
        name: "ქართული",
        icon: BookOpen,
        color: "var(--accent-purple)",
        progress: 71,
        quizzesDone: 19,
        lastStudied: "დღეს",
      },
    ],
    diary: [
      {
        id: "1",
        type: "quiz",
        title: "ბიოლოგიის Quiz",
        detail: "9/10",
        timestamp: "15:05",
        color: "var(--accent-purple)",
      },
      {
        id: "2",
        type: "study_plan",
        title: "ახალი Study Plan",
        detail: "14 დღე",
        timestamp: "13:24",
        color: "var(--accent-cyan)",
      },
      {
        id: "3",
        type: "ai_chat",
        title: "AI Teacher სესია",
        detail: "18 წთ",
        timestamp: "11:42",
        color: "var(--accent-green)",
      },
      {
        id: "4",
        type: "notes",
        title: "კონსპექტის განახლება",
        detail: "ქიმია",
        timestamp: "10:03",
        color: "var(--accent-amber)",
      },
      {
        id: "5",
        type: "presentation",
        title: "AI Presentation",
        detail: "12 სლაიდი",
        timestamp: "გუშინ",
        color: "var(--accent-pink)",
      },
    ],
  };
}
