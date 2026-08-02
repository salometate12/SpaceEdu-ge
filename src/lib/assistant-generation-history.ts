import type { PremiumAssistantPath } from "./assistant-routes";
import { getAssistantSidebarConfig } from "./assistant-sidebar-config";

const STORAGE_PREFIX = "spaceedu-assistant-history:";
const MAX_ENTRIES = 24;

export interface AssistantHistoryEntry {
  id: string;
  query: string;
  createdAt: number;
}

function storageKey(route: PremiumAssistantPath): string {
  return `${STORAGE_PREFIX}${route}`;
}

function readStored(route: PremiumAssistantPath): AssistantHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(route));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AssistantHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStored(route: PremiumAssistantPath, entries: AssistantHistoryEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(route), JSON.stringify(entries));
}

function seedEntries(route: PremiumAssistantPath): AssistantHistoryEntry[] {
  const now = Date.now();
  return getAssistantSidebarConfig(route).seedHistory.map((query, index) => ({
    id: `seed-${route}-${index}`,
    query,
    createdAt: now - (index + 1) * 60_000,
  }));
}

export function loadAssistantHistory(route: PremiumAssistantPath): AssistantHistoryEntry[] {
  const stored = readStored(route);
  if (stored.length > 0) return stored;
  return seedEntries(route);
}

export function appendAssistantHistory(
  route: PremiumAssistantPath,
  query: string,
  current: AssistantHistoryEntry[],
): AssistantHistoryEntry[] {
  const trimmed = query.trim();
  if (!trimmed) return current;

  const withoutDuplicate = current.filter(
    (entry) => entry.query.toLowerCase() !== trimmed.toLowerCase(),
  );

  const next: AssistantHistoryEntry[] = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      query: trimmed,
      createdAt: Date.now(),
    },
    ...withoutDuplicate,
  ].slice(0, MAX_ENTRIES);

  writeStored(route, next.filter((entry) => !entry.id.startsWith("seed-")));
  return next;
}

export function historyQueries(entries: AssistantHistoryEntry[]): string[] {
  return entries.map((entry) => entry.query);
}
