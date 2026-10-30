export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  /** A short nudge that doesn't give the answer away (generated decks). */
  hint?: string;
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
  /** Where a generated deck came from, e.g. „პრეზენტაცია: უჯრედი“. */
  source?: string;
  /** Generated decks (lib/custom-decks): kept in „ჩემი მასალები“. */
  status?: DeckStatus;
  /** The kind of material: file, youtube, presentation, audio, video, text. */
  sourceType?: MaterialSourceType;
  /** The file, video or presentation's own name. */
  sourceName?: string;
  /** How many cards were asked for (the N of „n / N“ while generating). */
  cardTarget?: number;
  /** ms */
  createdAt?: number;
  updatedAt?: number;
  lastOpenedAt?: number;
  /** Deleted (kept, empty, so another device's copy doesn't bring it back). */
  deletedAt?: number;
  /** The background job writing this deck (lib/generation-jobs). */
  jobId?: string;
  /** What to send again for „თავიდან ცდა“ (no files: those can't be kept). */
  retry?: GenerationRetry;
}

export type DeckStatus = "generating" | "ready" | "failed";

export type MaterialSourceType = "file" | "youtube" | "presentation" | "audio" | "video" | "text";

export interface GenerationRetry {
  topic?: string;
  difficulty?: string | null;
  text?: string;
  youtubeUrl?: string;
  youtubeRange?: { start: number; end: number } | null;
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
