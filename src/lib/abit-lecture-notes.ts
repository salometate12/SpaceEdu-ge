/** Independent lecture-notes store for the abiturient dashboard.
 *
 * Mirrors the /lecture-notes editor experience (title, date, long-form
 * content, AI keywords, contextual chat) but keeps its own localStorage
 * key so the abiturient space never shares notes with the student
 * journal. Pure helpers (blank note, date formatting, local keyword
 * extraction, upsert) are reused from the shared module. */

import {
  createBlankLectureNote,
  extractLocalKeywords,
  formatGeorgianDate,
  upsertLectureNote,
  type LectureNote,
} from "@/lib/lecture-notes";
import { DEFAULT_NOTE_COLOR, NOTE_COLORS, type NoteColor } from "@/lib/note-colors";

export const ABIT_LECTURE_NOTES_STORAGE_KEY = "spaceedu-abit-lecture-notes";
export const ABIT_LECTURE_NOTES_UPDATED_EVENT =
  "spaceedu-abit-lecture-notes-updated";

export {
  createBlankLectureNote,
  extractLocalKeywords,
  formatGeorgianDate,
  upsertLectureNote,
};
export type { LectureNote };

/**
 * A note in the abiturient space, which — unlike the student journal —
 * carries the colour it is written in. The extra field lives here rather
 * than on the shared `LectureNote` so the two stores stay independent.
 */
export interface AbitLectureNote extends LectureNote {
  color: NoteColor;
}

function readColor(value: unknown): NoteColor {
  return typeof value === "string" && value in NOTE_COLORS
    ? (value as NoteColor)
    : DEFAULT_NOTE_COLOR;
}

export function createBlankAbitNote(): AbitLectureNote {
  return { ...createBlankLectureNote(), color: DEFAULT_NOTE_COLOR };
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isLectureNote(value: unknown): value is LectureNote {
  if (!value || typeof value !== "object") return false;
  const note = value as Partial<LectureNote>;
  return (
    typeof note.id === "string" &&
    typeof note.title === "string" &&
    typeof note.date === "string" &&
    typeof note.content === "string" &&
    Array.isArray(note.aiKeywords)
  );
}

export function loadAbitLectureNotes(): AbitLectureNote[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(ABIT_LECTURE_NOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLectureNote).map((note) => ({
      ...note,
      section: "lectures" as const,
      pinned: false,
      aiKeywords: note.aiKeywords.filter(
        (tag) => typeof tag === "string" && tag.trim(),
      ),
      createdAt: typeof note.createdAt === "number" ? note.createdAt : Date.now(),
      updatedAt: typeof note.updatedAt === "number" ? note.updatedAt : Date.now(),
      // Notes written before colours existed open in the default one.
      color: readColor((note as { color?: unknown }).color),
    }));
  } catch {
    return [];
  }
}

export function saveAbitLectureNotes(notes: AbitLectureNote[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      ABIT_LECTURE_NOTES_STORAGE_KEY,
      JSON.stringify(notes),
    );
    window.dispatchEvent(new Event(ABIT_LECTURE_NOTES_UPDATED_EVENT));
  } catch {
    /* storage unavailable */
  }
}

export function previewAbitNote(content: string, maxLength = 96): string {
  const compact = content.replace(/\s+/g, " ").trim();
  if (!compact) return "ცარიელი ნოტი — დაიწყე წერა.";
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength).trim()}…`;
}
