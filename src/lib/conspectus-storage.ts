import { CONSPECTUS_STORAGE_KEY as STORAGE_KEY, CONSPECTUS_UPDATED_EVENT } from "./user-data-keys";
import { userStore } from "./user-data";

export { CONSPECTUS_UPDATED_EVENT };

export interface Conspectus {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  sourceLabel?: string;
  /** The kind of material (lib/types MaterialSourceType). */
  sourceType?: string;
  /** Saved once the whole text has arrived. */
  status?: "generating" | "ready" | "failed";
  /** ms, for „ბოლოს გახსნილი“. */
  lastOpenedAt?: number;
  /** ms: the later edit wins between two devices. */
  updatedAt?: number;
  /** Deleted (kept, empty, so another device's copy doesn't bring it back). */
  deletedAt?: number;
  /** „ჩემი საგნები“: the subject (semester subject id) and topic it was made for. */
  subjectId?: string;
  topicId?: string;
}

/** How many are kept (deleted ones aside). */
const LIMIT = 20;
const TOMBSTONE_DAYS = 60;

/** Every stored record, deleted ones included. */
function readAll(): Conspectus[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Conspectus[]) : [];
  } catch {
    return [];
  }
}

/** `notify`: tell open lists to re-read (not the page that's open, on its own visit). */
function writeAll(list: Conspectus[], now: number, notify = true): void {
  const cutoff = now - TOMBSTONE_DAYS * 86_400_000;
  const kept = list.filter((c) => !c.deletedAt || c.deletedAt > cutoff);
  const live = kept.filter((c) => !c.deletedAt).slice(0, LIMIT);
  userStore.set(STORAGE_KEY, kept.filter((c) => c.deletedAt || live.includes(c)));
  if (notify && typeof window !== "undefined") window.dispatchEvent(new Event(CONSPECTUS_UPDATED_EVENT));
}

export function getConspectusList(): Conspectus[] {
  return readAll().filter((c) => !c.deletedAt);
}

export function saveConspectus(conspectus: Conspectus, now: number = Date.now()): void {
  const filtered = readAll().filter((c) => c.id !== conspectus.id);
  writeAll([{ ...conspectus, updatedAt: now }, ...filtered], now);
}

function update(id: string, patch: Partial<Conspectus>, now: number, notify = true): void {
  const list = readAll();
  if (!list.some((c) => c.id === id && !c.deletedAt)) return;
  writeAll(list.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: now } : c)), now, notify);
}

/** For „ბოლოს გახსნილი“. Quiet: the open page mustn't reload over it. */
export function markConspectusOpened(id: string, now: number = Date.now()): void {
  update(id, { lastOpenedAt: now }, now, false);
}

export function renameConspectus(id: string, title: string, now: number = Date.now()): void {
  const next = title.trim();
  if (next) update(id, { title: next }, now);
}

/** Removes it everywhere: the record stays, empty, until the tombstone expires. */
export function deleteConspectus(id: string, now: number = Date.now()): void {
  update(id, { content: "", deletedAt: now }, now);
}

export function getConspectusById(id: string): Conspectus | undefined {
  return getConspectusList().find((c) => c.id === id);
}

export function extractTitleFromMarkdown(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match?.[1]) return match[1].trim();
  const firstLine = content.split("\n").find((l) => l.trim());
  return firstLine?.slice(0, 80).replace(/^#+\s*/, "") || "კონსპექტი";
}

export function createConspectusId(): string {
  return `conspectus-${Date.now()}`;
}
