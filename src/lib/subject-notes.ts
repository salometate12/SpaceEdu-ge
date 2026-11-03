/**
 * Lecture notes in „ჩემი საგნები“: each in a semester subject (or „საგნის
 * გარეშე“) and, when chosen, one of its topics. On the account (lib/
 * user-data, one user_items row per note); localStorage is the copy the
 * pages read. Deleted ones stay as empty records for a while, so another
 * device's copy doesn't bring them back.
 */
import { userStore } from "./user-data";
import { SUBJECT_NOTES_KEY, SUBJECT_NOTES_UPDATED_EVENT } from "./user-data-keys";

export { SUBJECT_NOTES_KEY, SUBJECT_NOTES_UPDATED_EVENT };

/** The „საგნის გარეშე“ group's place in the URL: /subjects/none. */
export const NO_SUBJECT = "none";

/** „ჰკითხე ამ ჩანაწერს“ keeps the last 20 messages with the note. */
export const ASK_HISTORY_LIMIT = 20;

const TOMBSTONE_DAYS = 60;

export interface AskMessage {
  role: "user" | "assistant";
  text: string;
  /** ms */
  at: number;
}

export interface SubjectNote {
  id: string;
  /** null: „საგნის გარეშე“. */
  subjectId: string | null;
  topicId?: string;
  title: string;
  body: string;
  /** YYYY-MM-DD */
  lectureDate: string;
  /** „საკვანძო თემები“, as the AI named them. */
  keywords: string[];
  /** What the key topics were made from, so the same text isn't sent again. */
  keywordsHash?: string;
  askHistory: AskMessage[];
  /** On the dashboard. */
  pinned: boolean;
  /** ms */
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  /** The /lecture-notes or journal entry it came from. */
  legacyId?: string;
}

/* --- Pure --------------------------------------------------------------- */

export function isSubjectNote(value: unknown): value is SubjectNote {
  if (!value || typeof value !== "object") return false;
  const note = value as Partial<SubjectNote>;
  return typeof note.id === "string" && typeof note.title === "string" && typeof note.body === "string";
}

/** Something is written in it: an untouched new note is never saved. */
export function hasContent(note: Pick<SubjectNote, "title" | "body">): boolean {
  return Boolean(note.title.trim() || note.body.trim());
}

/** Where a note opens. */
export function noteHref(note: Pick<SubjectNote, "id" | "subjectId">): string {
  return `/subjects/${encodeURIComponent(note.subjectId ?? NO_SUBJECT)}/notes/${encodeURIComponent(note.id)}`;
}

/** A new note's editor, for a subject (and topic). */
export function newNoteHref(subjectId: string | null, topicId?: string): string {
  const base = `/subjects/${encodeURIComponent(subjectId ?? NO_SUBJECT)}/notes/new`;
  return topicId ? `${base}?topic=${encodeURIComponent(topicId)}` : base;
}

/** The subject page with the note's topic open, for „უკან“. */
export function subjectHref(subjectId: string | null, topicId?: string): string {
  const base = `/subjects/${encodeURIComponent(subjectId ?? NO_SUBJECT)}`;
  return topicId ? `${base}?topic=${encodeURIComponent(topicId)}` : base;
}

const SHORT_MONTHS = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];

/** „22 ოქტ.“ */
export function shortNoteDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-").map(Number);
  if (!month || !day) return isoDate;
  return `${day} ${SHORT_MONTHS[month - 1]}.`;
}

/** The first line of the text, without markdown, for the list. */
export function firstLine(body: string): string {
  for (const line of body.split("\n")) {
    const clean = line.replace(/^#+\s*|^[-*>]\s+|\*\*|__|`/g, "").trim();
    if (clean) return clean;
  }
  return "";
}

/** Newest lecture first, then the latest edit. */
export function sortNotes(notes: SubjectNote[]): SubjectNote[] {
  return [...notes].sort((a, b) => b.lectureDate.localeCompare(a.lectureDate) || b.updatedAt - a.updatedAt);
}

export function blankNote(subjectId: string | null, topicId: string | undefined, lectureDate: string, now: number = Date.now()): SubjectNote {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `note-${now.toString(36)}`,
    subjectId,
    ...(topicId ? { topicId } : {}),
    title: "",
    body: "",
    lectureDate,
    keywords: [],
    askHistory: [],
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
}

/* --- Store -------------------------------------------------------------- */

function readAll(): SubjectNote[] {
  if (typeof window === "undefined") return [];
  const value = userStore.get<unknown>(SUBJECT_NOTES_KEY, []);
  return Array.isArray(value) ? value.filter(isSubjectNote) : [];
}

function writeAll(notes: SubjectNote[], now: number): void {
  const cutoff = now - TOMBSTONE_DAYS * 86_400_000;
  userStore.set(SUBJECT_NOTES_KEY, notes.filter((note) => !note.deletedAt || note.deletedAt > cutoff));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SUBJECT_NOTES_UPDATED_EVENT));
}

/** Every note, deleted ones too (the migration checks what it already moved). */
export function getAllNoteRecords(): SubjectNote[] {
  return readAll();
}

/** A subject's notes (null: „საგნის გარეშე“), or every note, newest lecture first. */
export function getNotes(subjectId?: string | null): SubjectNote[] {
  return sortNotes(readAll().filter((note) => !note.deletedAt && (subjectId === undefined || note.subjectId === subjectId)));
}

export function getNote(id: string): SubjectNote | undefined {
  return readAll().find((note) => note.id === id && !note.deletedAt);
}

export function getNoteByLegacyId(legacyId: string): SubjectNote | undefined {
  return readAll().find((note) => note.legacyId === legacyId && !note.deletedAt);
}

export function pinnedNotes(): SubjectNote[] {
  return readAll()
    .filter((note) => note.pinned && !note.deletedAt)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Saves the note as it is now (the editor's autosave). */
export function saveNote(note: SubjectNote, now: number = Date.now()): void {
  const rest = readAll().filter((item) => item.id !== note.id);
  writeAll([{ ...note, updatedAt: now }, ...rest], now);
}

/** Adds notes made elsewhere (the migration) in one write. */
export function addNotes(notes: SubjectNote[], now: number = Date.now()): void {
  if (notes.length === 0) return;
  const ids = new Set(notes.map((note) => note.id));
  writeAll([...notes, ...readAll().filter((note) => !ids.has(note.id))], now);
}

export function patchNote(id: string, patch: Partial<SubjectNote>, now: number = Date.now()): SubjectNote | undefined {
  let updated: SubjectNote | undefined;
  const notes = readAll().map((note) => {
    if (note.id !== id || note.deletedAt) return note;
    updated = { ...note, ...patch, updatedAt: now };
    return updated;
  });
  if (updated) writeAll(notes, now);
  return updated;
}

export function deleteNote(id: string, now: number = Date.now()): void {
  patchNote(id, { deletedAt: now, pinned: false }, now);
}

/** A topic was deleted: its notes stay in the subject, without it. */
export function detachTopic(topicId: string, now: number = Date.now()): void {
  const notes = readAll();
  if (!notes.some((note) => note.topicId === topicId && !note.deletedAt)) return;
  writeAll(
    notes.map((note) => {
      if (note.topicId !== topicId || note.deletedAt) return note;
      const next = { ...note, updatedAt: now };
      delete next.topicId;
      return next;
    }),
    now,
  );
}
