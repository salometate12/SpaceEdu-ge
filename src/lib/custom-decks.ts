import type { Deck } from "./types";
import { CUSTOM_DECKS_STORAGE_KEY as STORAGE_KEY, CUSTOM_DECKS_UPDATED_EVENT } from "./user-data-keys";
import { userStore } from "./user-data";

export { CUSTOM_DECKS_UPDATED_EVENT };

/** How long a deleted deck's empty record is kept, so other devices drop it too. */
const TOMBSTONE_DAYS = 60;

/** Every stored record, deleted ones included. */
function readAll(): Deck[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Deck[]) : [];
  } catch {
    return [];
  }
}

/** `notify`: tell open pages (lists, a deck being generated) to re-read. */
function writeAll(decks: Deck[], now: number, notify = true): void {
  const cutoff = now - TOMBSTONE_DAYS * 86_400_000;
  userStore.set(
    STORAGE_KEY,
    decks.filter((deck) => !deck.deletedAt || deck.deletedAt > cutoff),
  );
  if (notify && typeof window !== "undefined") window.dispatchEvent(new Event(CUSTOM_DECKS_UPDATED_EVENT));
}

export function getCustomDecks(): Deck[] {
  return readAll().filter((deck) => !deck.deletedAt);
}

export function saveCustomDeck(deck: Deck, now: number = Date.now()): void {
  const filtered = readAll().filter((d) => d.id !== deck.id);
  writeAll([{ ...deck, updatedAt: now }, ...filtered], now);
}

export function getCustomDeckById(id: string): Deck | undefined {
  return getCustomDecks().find((d) => d.id === id);
}

/** Changes one deck in place; `updatedAt` decides which copy two devices keep. */
export function updateCustomDeck(
  id: string,
  patch: Partial<Deck>,
  now: number = Date.now(),
  notify = true,
): Deck | undefined {
  let updated: Deck | undefined;
  const decks = readAll().map((deck) => {
    if (deck.id !== id || deck.deletedAt) return deck;
    updated = { ...deck, ...patch, updatedAt: now };
    return updated;
  });
  if (updated) writeAll(decks, now, notify);
  return updated;
}

export function renameCustomDeck(id: string, title: string): void {
  const next = title.trim();
  if (next) updateCustomDeck(id, { title: next });
}

/** Removes the deck everywhere: its record stays, empty, until the tombstone expires. */
export function deleteCustomDeck(id: string, now: number = Date.now()): void {
  const decks = readAll().map((deck): Deck =>
    deck.id === id
      ? { id: deck.id, title: deck.title, description: "", category: deck.category, cards: [], deletedAt: now, updatedAt: now }
      : deck,
  );
  writeAll(decks, now);
}

/** For „ბოლოს გახსნილი“. Quiet: the open deck mustn't reload over it. */
export function markDeckOpened(id: string, now: number = Date.now()): void {
  if (getCustomDeckById(id)) updateCustomDeck(id, { lastOpenedAt: now }, now, false);
}

export function createDeckFromGenerated(
  data: {
    deckTitle: string;
    deckDescription: string;
    cards: { question: string; answer: string; hint?: string }[];
  },
  category: Deck["category"] = "georgian",
  source?: string,
  id: string = `custom-${Date.now()}`,
): Deck {
  const now = Date.now();
  return {
    id,
    title: data.deckTitle,
    description: data.deckDescription,
    category,
    cards: data.cards.map((card, index) => ({
      id: `${id}-${index}`,
      question: card.question,
      answer: card.answer,
      ...(card.hint?.trim() ? { hint: card.hint.trim() } : {}),
    })),
    ...(source ? { source } : {}),
    status: "ready",
    createdAt: now,
    updatedAt: now,
  };
}
