/**
 * Reads what the AI teacher's starting cards are built from: the student's
 * semester subjects, journal entries and upcoming calendar/syllabus dates
 * (all of it synced with the account). The abiturient's are their exam
 * subjects. See `buildSuggestions`.
 */
import { SUBJECT_HUB_REGISTRY } from "@/lib/abiturient-subject-hub";
import type { SuggestionEvent, SuggestionNote, SuggestionSubject } from "@/lib/ai-teacher-suggestions";
import { loadLectureNotes } from "@/lib/lecture-notes";
import { SEMESTER_SUBJECTS_STORAGE_KEY, type SemesterSubjectsData } from "@/lib/semester-subjects";
import { getDashboardCalendarEvents, getGeneratedMilestones } from "@/lib/syllabus-calendar";
import { userStore } from "@/lib/user-data";

export interface SuggestionData {
  subjects: SuggestionSubject[];
  notes: SuggestionNote[];
  events: SuggestionEvent[];
  today: string;
}

/** The subject chip's dot: vivid enough for both themes. */
const DOT_COLORS = ["#8b5cf6", "#3b82f6", "#f59e0b", "#10b981", "#ec4899", "#06b6d4"];
const color = (index: number) => DOT_COLORS[index % DOT_COLORS.length];

function localToday(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function readSuggestionData(space: "student" | "abiturient"): SuggestionData {
  const today = localToday();
  if (space === "abiturient") {
    const subjects = Object.values(SUBJECT_HUB_REGISTRY)
      .filter((subject) => !subject.locked)
      .map((subject, index) => ({ name: subject.title, color: color(index) }));
    return { subjects, notes: [], events: [], today };
  }

  // Only what the student added: the dashboard's sample subjects don't count.
  const saved = userStore.get<Partial<SemesterSubjectsData> | null>(SEMESTER_SUBJECTS_STORAGE_KEY, null);
  const subjects = (Array.isArray(saved?.subjects) ? saved.subjects : [])
    .filter((subject) => subject?.name?.trim())
    .map((subject, index) => ({ name: subject.name.trim(), color: color(index) }));

  const notes = loadLectureNotes().map((note) => ({
    title: note.title,
    subject: note.subject,
    date: note.date,
    updatedAt: note.updatedAt,
  }));

  const seen = new Set<string>();
  const events: SuggestionEvent[] = [];
  for (const event of [...getDashboardCalendarEvents(), ...getGeneratedMilestones()]) {
    if (!event.date || seen.has(event.id)) continue;
    seen.add(event.id);
    events.push({
      title: event.title,
      date: event.date,
      type: event.type,
      description: "description" in event ? event.description : "topic" in event ? event.topic : undefined,
    });
  }
  return { subjects, notes, events, today };
}
