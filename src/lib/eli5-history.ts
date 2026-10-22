/**
 * The ELI5 page's memory on this device: the chosen level and the last
 * explanations (reopened without calling the AI), plus the explanation as
 * a journal entry's text. Pure helpers plus small storage wrappers.
 */
import { Eli5LevelSchema, type Eli5Level, type Eli5Response } from "@/lib/ai/eli5-schema";

export const ELI5_LEVEL_KEY = "spaceedu:eli5:level";
export const ELI5_HISTORY_KEY = "spaceedu:eli5:history";
export const ELI5_HISTORY_LIMIT = 20;

export interface Eli5HistoryItem {
  query: string;
  level: Eli5Level;
  result: Eli5Response;
  at: number;
}

/** A fresh history entry, stamped now. */
export function historyItem(query: string, level: Eli5Level, result: Eli5Response): Eli5HistoryItem {
  return { query, level, result, at: Date.now() };
}

/** Newest first; the same topic at the same level replaces the older one. */
export function addToHistory(history: Eli5HistoryItem[], item: Eli5HistoryItem): Eli5HistoryItem[] {
  const key = (entry: Eli5HistoryItem) => `${entry.level}:${entry.query.trim().toLowerCase()}`;
  return [item, ...history.filter((entry) => key(entry) !== key(item))].slice(0, ELI5_HISTORY_LIMIT);
}

function isHistoryItem(value: unknown): value is Eli5HistoryItem {
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

export function parseHistory(raw: string | null): Eli5HistoryItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isHistoryItem).slice(0, ELI5_HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

export function readEli5History(): Eli5HistoryItem[] {
  try {
    return parseHistory(window.localStorage.getItem(ELI5_HISTORY_KEY));
  } catch {
    return [];
  }
}

export function writeEli5History(history: Eli5HistoryItem[]): void {
  try {
    window.localStorage.setItem(ELI5_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // remembered for this visit only
  }
}

export function readEli5Level(): Eli5Level | null {
  try {
    const parsed = Eli5LevelSchema.safeParse(window.localStorage.getItem(ELI5_LEVEL_KEY));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeEli5Level(level: Eli5Level): void {
  try {
    window.localStorage.setItem(ELI5_LEVEL_KEY, level);
  } catch {
    // remembered for this visit only
  }
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
