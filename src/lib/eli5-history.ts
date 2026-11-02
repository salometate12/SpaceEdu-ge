/**
 * The ELI5 page's memory: the chosen level and the last explanations
 * (reopened without calling the AI), on the account (lib/user-data →
 * user_data / user_items, per-user RLS) so every device has them, plus the
 * explanation as a journal entry's text. Pure helpers plus small storage
 * wrappers.
 */
import { Eli5LevelSchema, type Eli5Level, type Eli5Response } from "@/lib/ai/eli5-schema";
import { userStore } from "@/lib/user-data";
import { ELI5_HISTORY_KEY, ELI5_HISTORY_LIMIT, ELI5_HISTORY_UPDATED_EVENT, ELI5_LEVEL_KEY } from "@/lib/user-data-keys";

export { ELI5_HISTORY_KEY, ELI5_HISTORY_LIMIT, ELI5_HISTORY_UPDATED_EVENT, ELI5_LEVEL_KEY };

export interface Eli5HistoryItem {
  /** The level and the topic: one entry each, on every device. */
  id: string;
  query: string;
  level: Eli5Level;
  result: Eli5Response;
  /** ms; `at` is the same, as stored before. */
  createdAt: number;
  at: number;
}

const itemId = (level: string, query: string) => `${level}:${query.trim().toLowerCase()}`;

/** A fresh history entry, stamped now. */
export function historyItem(query: string, level: Eli5Level, result: Eli5Response): Eli5HistoryItem {
  const now = Date.now();
  return { id: itemId(level, query), query, level, result, createdAt: now, at: now };
}

/** Newest first; the same topic at the same level replaces the older one. */
export function addToHistory(history: Eli5HistoryItem[], item: Eli5HistoryItem): Eli5HistoryItem[] {
  return [item, ...history.filter((entry) => entry.id !== item.id)].slice(0, ELI5_HISTORY_LIMIT);
}

function isHistoryItem(value: unknown): value is Omit<Eli5HistoryItem, "id" | "createdAt"> & Partial<Eli5HistoryItem> {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Eli5HistoryItem>;
  const result = item.result as Partial<Eli5Response> | undefined;
  return (
    typeof item.query === "string" &&
    Eli5LevelSchema.safeParse(item.level).success &&
    typeof item.at === "number" &&
    !!result &&
    typeof result.title === "string" &&
    typeof result.analogy === "string" &&
    typeof result.simple === "string" &&
    typeof result.oneLiner === "string"
  );
}

/** Stored entries, valid ones only; ones saved before ids get theirs. */
export function cleanHistory(value: unknown): Eli5HistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isHistoryItem)
    .map((item) => ({ ...item, id: item.id ?? itemId(item.level, item.query), createdAt: item.createdAt ?? item.at }))
    .slice(0, ELI5_HISTORY_LIMIT);
}

export function parseHistory(raw: string | null): Eli5HistoryItem[] {
  if (!raw) return [];
  try {
    return cleanHistory(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

export function readEli5History(): Eli5HistoryItem[] {
  if (typeof window === "undefined") return [];
  return cleanHistory(userStore.get<unknown>(ELI5_HISTORY_KEY, []));
}

export function writeEli5History(history: Eli5HistoryItem[]): void {
  if (typeof window === "undefined") return;
  userStore.set(ELI5_HISTORY_KEY, history);
  window.dispatchEvent(new Event(ELI5_HISTORY_UPDATED_EVENT));
}

export function readEli5Level(): Eli5Level | null {
  if (typeof window === "undefined") return null;
  const parsed = Eli5LevelSchema.safeParse(userStore.get<unknown>(ELI5_LEVEL_KEY, null));
  return parsed.success ? parsed.data : null;
}

export function writeEli5Level(level: Eli5Level): void {
  if (typeof window !== "undefined") userStore.set(ELI5_LEVEL_KEY, level);
}

/** The four parts as a journal entry's text. */
export function eli5ToNoteText(result: Eli5Response): string {
  return [
    `**ანალოგია**\n${result.analogy.trim()}`,
    `**მარტივად**\n${result.simple.trim()}`,
    result.example?.trim() ? `**რეალური მაგალითი**\n${result.example.trim()}` : "",
    `**ერთი წინადადებით**\n${result.oneLiner.trim()}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
