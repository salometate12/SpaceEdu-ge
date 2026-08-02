import { ka } from "./i18n";
import { programDecks2026 } from "./decks";
import type { Deck } from "./types";

export const categoryLabels = ka.categories;

export const decks: Deck[] = programDecks2026;

export function getDeckById(id: string): Deck | undefined {
  return decks.find((deck) => deck.id === id);
}
