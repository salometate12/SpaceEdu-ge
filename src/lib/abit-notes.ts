/** Standalone quick-notes store for the abiturient dashboard. Independent
 * of the student journal / lecture-notes system — its own localStorage
 * key, its own shape. */

export interface AbitNote {
  id: string;
  text: string;
  /** epoch ms */
  at: number;
}

const STORAGE_KEY = "spaceedu-abit-notes";
const MAX_NOTES = 60;

export const ABIT_NOTES_UPDATED_EVENT = "spaceedu-abit-notes-updated";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadAbitNotes(): AbitNote[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AbitNote[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((n) => n && typeof n.text === "string")
      .sort((a, b) => b.at - a.at);
  } catch {
    return [];
  }
}

function write(notes: AbitNote[]): AbitNote[] {
  const next = notes.sort((a, b) => b.at - a.at).slice(0, MAX_NOTES);
  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(ABIT_NOTES_UPDATED_EVENT));
    } catch {
      /* storage unavailable */
    }
  }
  return next;
}

export function addAbitNote(text: string): AbitNote[] {
  const trimmed = text.trim();
  if (!trimmed) return loadAbitNotes();
  return write([
    { id: crypto.randomUUID(), text: trimmed, at: Date.now() },
    ...loadAbitNotes(),
  ]);
}

export function updateAbitNote(id: string, text: string): AbitNote[] {
  const trimmed = text.trim();
  const notes = loadAbitNotes();
  if (!trimmed) return write(notes.filter((n) => n.id !== id));
  return write(
    notes.map((n) => (n.id === id ? { ...n, text: trimmed, at: Date.now() } : n)),
  );
}

export function deleteAbitNote(id: string): AbitNote[] {
  return write(loadAbitNotes().filter((n) => n.id !== id));
}
