import type { Deck } from "./types";

const STORAGE_KEY = "flashcards-custom-decks";

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify([deck, ...filtered]));
}

export function getCustomDeckById(id: string): Deck | undefined {
  return getCustomDecks().find((d) => d.id === id);
}

export function createDeckFromGenerated(
  data: {
    deckTitle: string;
    deckDescription: string;
    cards: { question: string; answer: string }[];
  },
  category: Deck["category"] = "georgian",
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
    })),
  };
}
