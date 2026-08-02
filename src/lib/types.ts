export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export type DeckCategory =
  | "all"
  | "history"
  | "geography"
  | "georgian"
  | "civic"
  | "biology"
  | "chemistry"
  | "physics"
  | "math";

export interface Deck {
  id: string;
  title: string;
  description: string;
  category: Exclude<DeckCategory, "all">;
  cards: Flashcard[];
}

export interface DeckProgress {
  deckId: string;
  learnedCardIds: string[];
}

export interface StudySessionResult {
  known: number;
  unknown: number;
  total: number;
}
