import type { DeckProgress } from "./types";

const STORAGE_KEY = "flashcards-progress";

function readAll(): DeckProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DeckProgress[];
  } catch {
    return [];
  }
}

function writeAll(progress: DeckProgress[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function getDeckProgress(deckId: string): DeckProgress {
  const existing = readAll().find((p) => p.deckId === deckId);
  return existing ?? { deckId, learnedCardIds: [] };
}

export function markCardLearned(deckId: string, cardId: string): void {
  const all = readAll();
  const index = all.findIndex((p) => p.deckId === deckId);
  const current = index >= 0 ? all[index] : { deckId, learnedCardIds: [] };

  if (!current.learnedCardIds.includes(cardId)) {
    current.learnedCardIds = [...current.learnedCardIds, cardId];
  }

  if (index >= 0) {
    all[index] = current;
  } else {
    all.push(current);
  }

  writeAll(all);
}

export function resetDeckProgress(deckId: string): void {
  const all = readAll().filter((p) => p.deckId !== deckId);
  writeAll(all);
}
