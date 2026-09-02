export const LECTURE_NOTES_STORAGE_KEY = "spaceedu-lecture-notes";
export const LECTURE_NOTES_UPDATED_EVENT = "spaceedu-lecture-notes-updated";

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
  pinned: boolean;
  aiKeywords: string[];
  createdAt: number;
  updatedAt: number;
}

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

export function createBlankLectureNote(): LectureNote {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "",
    date: todayIsoDate(),
    content: "",
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
    return parsed.filter(isLectureNote).map((note) => ({
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
  window.localStorage.setItem(LECTURE_NOTES_STORAGE_KEY, JSON.stringify(notes));
  window.dispatchEvent(new Event(LECTURE_NOTES_UPDATED_EVENT));
}

export function upsertLectureNote(notes: LectureNote[], next: LectureNote): LectureNote[] {
  const index = notes.findIndex((note) => note.id === next.id);
  if (index === -1) return [next, ...notes];
  const copy = [...notes];
  copy[index] = next;
  return copy.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function pinnedLectureNotes(notes: LectureNote[]): LectureNote[] {
  return notes.filter((note) => note.pinned).sort((a, b) => b.updatedAt - a.updatedAt);
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

export const STICKER_TONES = [
  {
    card: "border-amber-200/80 bg-amber-100/85 dark:border-amber-300/20 dark:bg-amber-300/15",
    ink: "text-amber-950 dark:text-amber-50",
    muted: "text-amber-800/70 dark:text-amber-100/70",
    chip: "border-amber-300/70 bg-white/55 text-amber-900 dark:border-amber-200/20 dark:bg-white/10 dark:text-amber-100",
  },
  {
    card: "border-cyan-200/80 bg-cyan-100/85 dark:border-cyan-300/20 dark:bg-cyan-300/15",
    ink: "text-cyan-950 dark:text-cyan-50",
    muted: "text-cyan-800/70 dark:text-cyan-100/70",
    chip: "border-cyan-300/70 bg-white/55 text-cyan-900 dark:border-cyan-200/20 dark:bg-white/10 dark:text-cyan-100",
  },
  {
    card: "border-stone-200/90 bg-[#F5EFE0]/90 dark:border-stone-400/20 dark:bg-stone-300/10",
    ink: "text-stone-900 dark:text-stone-50",
    muted: "text-stone-600 dark:text-stone-300/80",
    chip: "border-stone-300/80 bg-white/55 text-stone-800 dark:border-white/15 dark:bg-white/10 dark:text-stone-100",
  },
] as const;

export function stickerToneForId(id: string): (typeof STICKER_TONES)[number] {
  const sum = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return STICKER_TONES[sum % STICKER_TONES.length];
}
