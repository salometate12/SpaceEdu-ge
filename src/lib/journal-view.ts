/**
 * What the journal page shows, as pure functions: grouping entries by day,
 * searching, the Georgian date line, and the editor's autosave.
 */
import type { JournalSection, LectureNote } from "@/lib/lecture-notes";

const MONTHS = [
  "იანვარი",
  "თებერვალი",
  "მარტი",
  "აპრილი",
  "მაისი",
  "ივნისი",
  "ივლისი",
  "აგვისტო",
  "სექტემბერი",
  "ოქტომბერი",
  "ნოემბერი",
  "დეკემბერი",
];
const WEEKDAYS = ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"];

/** „15 ოქტომბერი 2026 · ორშაბათი“ for a note's YYYY-MM-DD date. */
export function formatJournalDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(year, month - 1, day);
  return `${day} ${MONTHS[month - 1]} ${year} · ${WEEKDAYS[date.getDay()]}`;
}

/** A note worth listing: something is written in it. */
export function hasText(note: LectureNote): boolean {
  return Boolean(note.title.trim() || note.content.trim() || note.contentRight?.trim());
}

/** The whole entry as one text (older notes kept a second page). */
export function noteText(note: Pick<LectureNote, "content" | "contentRight">): string {
  const right = note.contentRight?.trim();
  return right ? `${note.content.trimEnd()}\n\n${right}` : note.content;
}

/** The AI tools need something to work with. */
export const AI_MIN_LENGTH = 50;
export function enoughForAi(text: string): boolean {
  return text.trim().length >= AI_MIN_LENGTH;
}

/** Entries of a category (or all), matching the search in title or text. */
export function filterNotes(
  notes: LectureNote[],
  { category, query }: { category: JournalSection | "all"; query: string },
): LectureNote[] {
  const needle = query.trim().toLowerCase();
  return notes.filter(
    (note) =>
      hasText(note) &&
      (category === "all" || note.section === category) &&
      (!needle || `${note.title}\n${noteText(note)}\n${note.subject ?? ""}`.toLowerCase().includes(needle)),
  );
}

export interface NoteGroup {
  id: "pinned" | "today" | "yesterday" | "week" | "earlier";
  label: string;
  notes: LectureNote[];
}

/** Pinned first, then „დღეს“, „გუშინ“, „ამ კვირაში“, „ადრე“ by last edit; newest first in each. */
export function groupNotesByDay(notes: LectureNote[], now: number = Date.now()): NoteGroup[] {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const day = 86_400_000;
  const groups: NoteGroup[] = [
    { id: "pinned", label: "დამაგრებული", notes: [] },
    { id: "today", label: "დღეს", notes: [] },
    { id: "yesterday", label: "გუშინ", notes: [] },
    { id: "week", label: "ამ კვირაში", notes: [] },
    { id: "earlier", label: "ადრე", notes: [] },
  ];
  const byId = Object.fromEntries(groups.map((group) => [group.id, group]));
  for (const note of [...notes].sort((a, b) => b.updatedAt - a.updatedAt)) {
    if (note.pinned) byId.pinned.notes.push(note);
    else if (note.updatedAt >= startOfToday) byId.today.notes.push(note);
    else if (note.updatedAt >= startOfToday - day) byId.yesterday.notes.push(note);
    else if (note.updatedAt >= startOfToday - 6 * day) byId.week.notes.push(note);
    else byId.earlier.notes.push(note);
  }
  return groups.filter((group) => group.notes.length > 0);
}

export type SaveStatus = "idle" | "saving" | "saved";

/**
 * The editor's autosave: every change is saved `delay` ms after the last
 * one (debounce); `flush` saves at once (leaving the page). `onStatus`
 * drives „ინახება…“ / „შენახულია ✓“.
 */
export function createAutosave<T>(save: (value: T) => void, onStatus: (status: SaveStatus) => void, delay = 800) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { value: T } | null = null;
  const run = () => {
    timer = null;
    if (!pending) return;
    const { value } = pending;
    pending = null;
    save(value);
    onStatus("saved");
  };
  return {
    schedule(value: T) {
      pending = { value };
      onStatus("saving");
      if (timer) clearTimeout(timer);
      timer = setTimeout(run, delay);
    },
    flush() {
      if (timer) clearTimeout(timer);
      run();
    },
    cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = null;
    },
  };
}
