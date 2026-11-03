import { JOURNAL_PROGRESS_KEY, LECTURE_NOTES_STORAGE_KEY, LECTURE_NOTES_UPDATED_EVENT } from "./user-data-keys";
import { userStore } from "./user-data";

export { JOURNAL_PROGRESS_KEY, LECTURE_NOTES_STORAGE_KEY, LECTURE_NOTES_UPDATED_EVENT };
export const JOURNAL_XP_PER_SAVE = 50;

/** The journal's kinds of entry. Lecture notes are in „ჩემი საგნები“ now (lib/subject-notes). */
export const JOURNAL_SECTION_IDS = ["assignments", "ai-notes", "ideas"] as const;
export type JournalSection = (typeof JOURNAL_SECTION_IDS)[number];

export function isJournalSection(value: unknown): value is JournalSection {
  return typeof value === "string" && (JOURNAL_SECTION_IDS as readonly string[]).includes(value);
}

/** A new entry of this kind, opened in the editor and saved once written in. */
export function journalNewHref(section: JournalSection): string {
  return `/journal?new=${section}`;
}

export function journalHref(id?: string, tab?: JournalSection): string {
  const params = new URLSearchParams();
  if (tab) params.set("tab", tab);
  if (id) params.set("id", id);
  const query = params.toString();
  return query ? `/journal?${query}` : "/journal";
}

const GEORGIAN_MONTHS = [
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

const GEORGIAN_STOPWORDS = new Set([
  "და",
  "რომ",
  "არის",
  "იყო",
  "ამ",
  "იმ",
  "თუ",
  "როგორც",
  "შემდეგ",
  "ასევე",
  "მაგრამ",
  "ან",
  "უნდა",
  "შეიძლება",
  "რადგან",
  "მათ",
  "მისი",
  "ჩვენ",
  "თქვენ",
  "ეს",
  "ის",
]);

export interface LectureNote {
  id: string;
  title: string;
  date: string;
  content: string;
  /** The right-hand page of the spread. Optional: notes written before the
   *  journal had two writable pages simply have none. */
  contentRight?: string;
  section: JournalSection;
  /** A semester subject the entry belongs to, if the student picked one. */
  subject?: string;
  pinned: boolean;
  aiKeywords: string[];
  createdAt: number;
  updatedAt: number;
}

export interface JournalProgress {
  xp: number;
  streak: number;
  lastSaveDate: string | null;
  unlocked: Record<string, boolean>;
}

const EMPTY_PROGRESS: JournalProgress = {
  xp: 0,
  streak: 0,
  lastSaveDate: null,
  unlocked: {},
};

export function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatGeorgianDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const day = match[3];
  const monthIndex = Number(match[2]) - 1;
  const month = GEORGIAN_MONTHS[monthIndex] ?? match[2];
  return `${day} ${month}`;
}

export function createBlankLectureNote(section: JournalSection = "ideas"): LectureNote {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "",
    date: todayIsoDate(),
    content: "",
    section,
    pinned: false,
    aiKeywords: [],
    createdAt: now,
    updatedAt: now,
  };
}

function isLectureNote(value: unknown): value is LectureNote {
  if (!value || typeof value !== "object") return false;
  const note = value as Partial<LectureNote>;
  return (
    typeof note.id === "string" &&
    typeof note.title === "string" &&
    typeof note.date === "string" &&
    typeof note.content === "string" &&
    typeof note.pinned === "boolean" &&
    Array.isArray(note.aiKeywords)
  );
}

export function loadLectureNotes(): LectureNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LECTURE_NOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Lectures (and entries from before the journal had kinds) moved to „ჩემი საგნები“.
    return parsed.filter((note): note is LectureNote => isLectureNote(note) && isJournalSection(note.section)).map((note) => ({
      ...note,
      aiKeywords: note.aiKeywords.filter((tag) => typeof tag === "string" && tag.trim()),
      createdAt: typeof note.createdAt === "number" ? note.createdAt : Date.now(),
      updatedAt: typeof note.updatedAt === "number" ? note.updatedAt : Date.now(),
    }));
  } catch {
    return [];
  }
}

export function saveLectureNotes(notes: LectureNote[]): void {
  if (typeof window === "undefined") return;
  // Lectures the move to „ჩემი საგნები“ hasn't taken yet stay in the list for it.
  const ids = new Set(notes.map((note) => note.id));
  const stored = userStore.get<unknown>(LECTURE_NOTES_STORAGE_KEY, []);
  const waiting = (Array.isArray(stored) ? stored : []).filter(
    (item) => item && typeof item === "object" && !isJournalSection((item as LectureNote).section) && !ids.has((item as LectureNote).id),
  );
  // On this device now, on the account shortly after.
  userStore.set(LECTURE_NOTES_STORAGE_KEY, [...notes, ...waiting]);
  window.dispatchEvent(new Event(LECTURE_NOTES_UPDATED_EVENT));
}

/** Generic in the note type so stores that extend `LectureNote` — the
 *  abiturient one adds a colour — keep their own shape through an edit. */
export function upsertLectureNote<T extends LectureNote>(notes: T[], next: T): T[] {
  const index = notes.findIndex((note) => note.id === next.id);
  if (index === -1) return [next, ...notes];
  const copy = [...notes];
  copy[index] = next;
  return copy.sort((a, b) => b.updatedAt - a.updatedAt);
}

function isJournalProgress(value: unknown): value is JournalProgress {
  if (!value || typeof value !== "object") return false;
  const progress = value as Partial<JournalProgress>;
  return typeof progress.xp === "number" && typeof progress.streak === "number";
}

export function loadJournalProgress(): JournalProgress {
  if (typeof window === "undefined") return { ...EMPTY_PROGRESS };
  try {
    const raw = window.localStorage.getItem(JOURNAL_PROGRESS_KEY);
    if (!raw) return { ...EMPTY_PROGRESS };
    const parsed = JSON.parse(raw) as unknown;
    if (!isJournalProgress(parsed)) return { ...EMPTY_PROGRESS };
    return {
      xp: parsed.xp,
      streak: parsed.streak,
      lastSaveDate: typeof parsed.lastSaveDate === "string" ? parsed.lastSaveDate : null,
      unlocked: parsed.unlocked && typeof parsed.unlocked === "object" ? parsed.unlocked : {},
    };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

export function saveJournalProgress(progress: JournalProgress): void {
  if (typeof window === "undefined") return;
  userStore.set(JOURNAL_PROGRESS_KEY, progress);
}

function yesterdayIsoDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function awardJournalSave(progress: JournalProgress): {
  progress: JournalProgress;
  xpGained: number;
} {
  const today = todayIsoDate();
  let streak = progress.streak;
  if (progress.lastSaveDate === today) {
    streak = Math.max(streak, 1);
  } else if (progress.lastSaveDate === yesterdayIsoDate()) {
    streak += 1;
  } else {
    streak = 1;
  }
  return {
    xpGained: JOURNAL_XP_PER_SAVE,
    progress: {
      ...progress,
      xp: progress.xp + JOURNAL_XP_PER_SAVE,
      streak,
      lastSaveDate: today,
    },
  };
}

export function previewLectureNote(content: string, maxLength = 96): string {
  const compact = content.replace(/\s+/g, " ").trim();
  if (!compact) return "ცარიელი ნოტი — დაიწყე წერა ლექციის დროს.";
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength).trim()}…`;
}

export function extractLocalKeywords(text: string, limit = 8): string[] {
  const acronyms = text.match(/\b[A-Z]{2,}(?:[/-][A-Z0-9]{2,})?\b/g) ?? [];
  const hashed = (text.match(/#([\p{L}\d_/-]{2,})/gu) ?? []).map((tag) => tag.slice(1));
  const georgian = text.match(/[\u10A0-\u10FF]{5,}/g) ?? [];
  const latinTerms = text.match(/\b[A-Za-z][A-Za-z0-9+/-]{3,}\b/g) ?? [];

  const ranked = new Map<string, number>();
  const push = (raw: string, weight: number) => {
    const tag = raw.replace(/^#/, "").trim();
    if (tag.length < 2) return;
    if (GEORGIAN_STOPWORDS.has(tag.toLowerCase())) return;
    ranked.set(tag, (ranked.get(tag) ?? 0) + weight);
  };

  acronyms.forEach((tag) => push(tag, 5));
  hashed.forEach((tag) => push(tag, 4));
  georgian.forEach((tag) => push(tag, 2));
  latinTerms.forEach((tag) => push(tag, 1));

  return [...ranked.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag]) => tag);
}
