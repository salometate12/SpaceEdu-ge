/**
 * The lecture notes of /lecture-notes and the journal's „ლექციები“ move to
 * „ჩემი საგნები“: each into the semester subject its name matches (exactly,
 * else the closest), the rest into „საგნის გარეშე“. Empty ones aren't
 * moved. The other kinds of journal entry stay where they are.
 *
 * Safe to run any number of times, on any device: a moved note's id is
 * made from the old one (`lecture-<id>`), so two devices moving the same
 * note make one, and a note already moved (or moved and deleted) isn't
 * made again. The old list is kept as `…:backup` on the device for a
 * release.
 */
import { addNotes, getAllNoteRecords, type SubjectNote } from "@/lib/subject-notes";
import { readSavedSemesterSubjects } from "@/lib/semester-subjects";
import { userStore } from "@/lib/user-data";
import { LECTURE_NOTES_STORAGE_KEY, LECTURE_NOTES_UPDATED_EVENT } from "@/lib/user-data-keys";

export const MIGRATION_FLAG_KEY = "spaceedu:migrations:lectureNotesToSubjects";
export const BACKUP_KEY = `${LECTURE_NOTES_STORAGE_KEY}:backup`;
/** „pending“ once notes were moved here; „shown“ after the one toast. */
export const MOVED_TOAST_KEY = "spaceedu:lecture-notes-moved-toast";

/** The journal's own kinds; anything else (or none: notes from before the journal) was a lecture. */
const JOURNAL_KINDS = new Set(["assignments", "ai-notes", "ideas"]);

const UNTITLED = new Set(["", "უსათაურო", "უსათაურო ლექცია", "untitled"]);

interface OldNote {
  id?: unknown;
  title?: unknown;
  date?: unknown;
  content?: unknown;
  contentRight?: unknown;
  section?: unknown;
  subject?: unknown;
  pinned?: unknown;
  aiKeywords?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

const text = (value: unknown) => (typeof value === "string" ? value : "");

export function isLectureEntry(value: unknown): boolean {
  return Boolean(value && typeof value === "object" && !JOURNAL_KINDS.has(text((value as OldNote).section)));
}

function bodyOf(note: OldNote): string {
  const left = text(note.content);
  const right = text(note.contentRight).trim();
  return right ? `${left.trimEnd()}\n\n${right}` : left;
}

/** Nothing written in it: an „უსათაურო“ title, at most, and no text. */
export function isEmptyLecture(note: OldNote): boolean {
  return UNTITLED.has(text(note.title).trim().toLowerCase()) && !bodyOf(note).trim();
}

const normalize = (name: string) =>
  name
    .toLowerCase()
    .replace(/[„“"'«».,:;()\-–]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Two-letter pieces of a name, for how alike two names are. */
function pairs(name: string): string[] {
  const compact = name.replace(/\s+/g, "");
  return Array.from({ length: Math.max(0, compact.length - 1) }, (_, index) => compact.slice(index, index + 2));
}

/** 0 to 1: how many two-letter pieces the names share (Dice). */
export function nameSimilarity(a: string, b: string): number {
  const left = pairs(normalize(a));
  const right = pairs(normalize(b));
  if (left.length === 0 || right.length === 0) return 0;
  const pool = [...right];
  let shared = 0;
  for (const piece of left) {
    const index = pool.indexOf(piece);
    if (index !== -1) {
      shared += 1;
      pool.splice(index, 1);
    }
  }
  return (2 * shared) / (left.length + right.length);
}

/** The subject a free-text name means: the same name, else one containing the other, else the closest above 0.6. */
export function matchSubject(name: string, subjects: { id: string; name: string }[]): string | null {
  const wanted = normalize(name);
  if (!wanted) return null;
  const exact = subjects.find((subject) => normalize(subject.name) === wanted);
  if (exact) return exact.id;
  const containing = subjects.filter((subject) => {
    const candidate = normalize(subject.name);
    return candidate && (candidate.includes(wanted) || wanted.includes(candidate));
  });
  if (containing.length === 1) return containing[0].id;
  let best: { id: string; score: number } | null = null;
  for (const subject of containing.length > 1 ? containing : subjects) {
    const score = nameSimilarity(wanted, subject.name);
    if (!best || score > best.score) best = { id: subject.id, score };
  }
  return best && best.score >= 0.6 ? best.id : null;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function dayOf(ms: number): string {
  const date = new Date(ms);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Key topics as „ჩემი საგნები“ shows them: no #, no _. */
export function cleanKeyword(tag: string): string {
  return tag.replace(/#/g, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

/** The old note as a subject note. */
export function toSubjectNote(note: OldNote, subjects: { id: string; name: string }[], now: number): SubjectNote {
  const legacyId = text(note.id);
  const createdAt = typeof note.createdAt === "number" ? note.createdAt : now;
  const updatedAt = typeof note.updatedAt === "number" ? note.updatedAt : createdAt;
  const date = text(note.date);
  const keywords = Array.isArray(note.aiKeywords)
    ? [...new Set(note.aiKeywords.filter((tag): tag is string => typeof tag === "string").map(cleanKeyword).filter(Boolean))].slice(0, 8)
    : [];
  return {
    id: `lecture-${legacyId}`,
    subjectId: matchSubject(text(note.subject), subjects),
    title: UNTITLED.has(text(note.title).trim().toLowerCase()) ? "" : text(note.title).trim(),
    body: bodyOf(note),
    lectureDate: ISO_DAY.test(date) ? date : dayOf(createdAt),
    keywords,
    askHistory: [],
    pinned: note.pinned === true,
    createdAt,
    updatedAt,
    legacyId,
  };
}

/**
 * What the move does to the old list: the notes to add to „ჩემი საგნები“
 * (not ones moved before) and the journal entries that stay.
 */
export function planMigration(
  old: unknown[],
  existing: Pick<SubjectNote, "id" | "legacyId">[],
  subjects: { id: string; name: string }[],
  now: number,
): { add: SubjectNote[]; keep: unknown[]; lectures: number } {
  const moved = new Set(existing.flatMap((note) => [note.id, note.legacyId ? `lecture-${note.legacyId}` : ""]));
  const add: SubjectNote[] = [];
  const keep: unknown[] = [];
  let lectures = 0;
  for (const item of old) {
    if (!isLectureEntry(item)) {
      keep.push(item);
      continue;
    }
    lectures += 1;
    const note = item as OldNote;
    const id = text(note.id);
    if (!id || isEmptyLecture(note)) continue;
    const next = toSubjectNote(note, subjects, now);
    if (moved.has(next.id)) continue;
    moved.add(next.id);
    add.push(next);
  }
  return { add, keep, lectures };
}

function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage blocked: the move still happened on the account
  }
}

/** The old list as it was, on this device (each entry once, the latest copy). */
function backUp(old: unknown[]): void {
  let saved: unknown[] = [];
  try {
    const parsed = JSON.parse(readLocal(BACKUP_KEY) ?? "[]") as unknown;
    if (Array.isArray(parsed)) saved = parsed;
  } catch {
    saved = [];
  }
  const byId = new Map<string, unknown>();
  for (const item of [...saved, ...old]) {
    const id = item && typeof item === "object" ? text((item as OldNote).id) : "";
    if (id) byId.set(id, item);
  }
  writeLocal(BACKUP_KEY, JSON.stringify([...byId.values()]));
}

/**
 * Moves what's left of the lecture notes. Returns how many were added to
 * „ჩემი საგნები“. Run when the account's data is in (not while syncing),
 * and again whenever the old list changes (another device's copy).
 */
export function runLectureNotesMigration(now: number = Date.now()): number {
  if (typeof window === "undefined") return 0;
  const old = userStore.get<unknown>(LECTURE_NOTES_STORAGE_KEY, []);
  if (!Array.isArray(old)) return 0;
  const plan = planMigration(old, getAllNoteRecords(), readSavedSemesterSubjects(), now);
  if (plan.lectures > 0) {
    backUp(old.filter(isLectureEntry));
    addNotes(plan.add, now);
    userStore.set(LECTURE_NOTES_STORAGE_KEY, plan.keep);
    window.dispatchEvent(new Event(LECTURE_NOTES_UPDATED_EVENT));
  }
  if (plan.add.length > 0 && readLocal(MOVED_TOAST_KEY) !== "shown") writeLocal(MOVED_TOAST_KEY, "pending");
  if (readLocal(MIGRATION_FLAG_KEY) !== "done") writeLocal(MIGRATION_FLAG_KEY, "done");
  return plan.add.length;
}

/** The one toast after the move: true once, then never again. */
export function takeMovedToast(): boolean {
  if (typeof window === "undefined" || readLocal(MOVED_TOAST_KEY) !== "pending") return false;
  writeLocal(MOVED_TOAST_KEY, "shown");
  return true;
}
