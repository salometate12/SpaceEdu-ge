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
  icon: string;
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
      examDate: "2026-07-15",
      quizImprovement: 7,
      personalBestStreak: 14,
    },
    subjects: [
      {
        name: "ბიოლოგია",
        icon: "🧬",
        color: "var(--accent-green)",
        progress: 78,
        quizzesDone: 21,
        lastStudied: "დღეს",
      },
      {
        name: "ქიმია",
        icon: "🧪",
        color: "var(--accent-cyan)",
        progress: 64,
        quizzesDone: 17,
        lastStudied: "გუშინ",
      },
      {
        name: "ისტორია",
        icon: "🏛️",
        color: "var(--accent-amber)",
        progress: 52,
        quizzesDone: 13,
        lastStudied: "2 დღის წინ",
      },
      {
        name: "ქართული",
        icon: "📚",
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
