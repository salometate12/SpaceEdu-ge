import type { Deck } from "./types";
import { CUSTOM_DECKS_STORAGE_KEY as STORAGE_KEY, CUSTOM_DECKS_UPDATED_EVENT } from "./user-data-keys";
import { userStore } from "./user-data";

export { CUSTOM_DECKS_UPDATED_EVENT };

export function getCustomDecks(): Deck[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Deck[];
  } catch {
    return [];
  }
}

export function saveCustomDeck(deck: Deck): void {
  const existing = getCustomDecks();
  const filtered = existing.filter((d) => d.id !== deck.id);
  userStore.set(STORAGE_KEY, [deck, ...filtered]);
}

export function getCustomDeckById(id: string): Deck | undefined {
  return getCustomDecks().find((d) => d.id === id);
}

export function createDeckFromGenerated(
  data: {
    deckTitle: string;
    deckDescription: string;
    cards: { question: string; answer: string; hint?: string }[];
  },
  category: Deck["category"] = "georgian",
  source?: string,
): Deck {
  const id = `custom-${Date.now()}`;
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
  };
}
