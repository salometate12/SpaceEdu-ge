import { getToolUsageEvents } from "@/lib/activity";
import { readQuizAttempts } from "@/lib/dashboard-metrics";
import { readSemesterSubjects } from "@/lib/semester-subjects";

/**
 * Per-subject progress for the student's *own* semester subjects. Built
 * from the activity we track locally: tool opens tagged with the active
 * subject, and quiz runs taken while that subject was selected.
 */

export interface SubjectProgressStat {
  name: string;
  /** Quiz runs taken for this subject. */
  quizzes: number;
  /** Average quiz accuracy %, or null if no quiz yet. */
  accuracy: number | null;
  /** Tool opens (AI teacher, notes, syllabus, …) tagged with this subject. */
  activityCount: number;
  /** epoch ms of the most recent activity, or null. */
  lastActivityAt: number | null;
  /** 0–100 bar value: quiz accuracy once quizzes exist, otherwise a soft
   * activity-based fill so early effort still shows. */
  progress: number;
}

function lastActivityLabel(at: number | null, now: Date = new Date()): string {
  if (at === null) return "ჯერ არ დაწყებულა";
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const startOfThen = new Date(at).setHours(0, 0, 0, 0);
  const days = Math.max(0, Math.round((startOfToday - startOfThen) / 86_400_000));
  if (days === 0) return "დღეს";
  if (days === 1) return "გუშინ";
  if (days < 7) return `${days} დღის წინ`;
  return `${Math.floor(days / 7)} კვირის წინ`;
}

export function computeSubjectProgress(): {
  subjects: SubjectProgressStat[];
  semesterLabel: string;
} {
  const { subjects, semesterLabel } = readSemesterSubjects();
  const events = getToolUsageEvents();
  const attempts = readQuizAttempts();

  const stats = subjects.map((subject): SubjectProgressStat => {
    const name = subject.name;
    const subjectEvents = events.filter((e) => e.subject === name);
    const subjectQuizzes = attempts.filter((a) => a.subject === name);

    const correct = subjectQuizzes.reduce((sum, a) => sum + a.correct, 0);
    const totalQ = subjectQuizzes.reduce((sum, a) => sum + a.total, 0);
    const accuracy = totalQ > 0 ? Math.round((correct / totalQ) * 100) : null;

    const timestamps = [
      ...subjectEvents.map((e) => e.timestamp),
      ...subjectQuizzes.map((a) => a.at),
    ];
    const lastActivityAt = timestamps.length > 0 ? Math.max(...timestamps) : null;

    const progress =
      accuracy !== null
        ? accuracy
        : Math.min(90, subjectEvents.length * 12);

    return {
      name,
      quizzes: subjectQuizzes.length,
      accuracy,
      activityCount: subjectEvents.length,
      lastActivityAt,
      progress,
    };
  });

  return { subjects: stats, semesterLabel };
}

export { lastActivityLabel };
