/**
 * A pass through a flashcard deck, as plain data: the first round goes
 * through every card, then a round with only the „არ ვიცი“ ones starts by
 * itself; after that the deck is done and the results say what's left.
 * Kept on the account (lib/user-data → user_data, per-user RLS), so a
 * reload or another device carries on where the student stopped.
 */
import { userStore } from "./user-data";
import { FLASHCARD_SESSIONS_KEY, FLASHCARD_SESSIONS_LIMIT } from "./user-data-keys";

export type CardStatus = "known" | "unknown";

export interface FlashcardSession {
  /** The deck's id: one session per deck. */
  id: string;
  /** Card ids of the current round, in the order shown. */
  order: string[];
  /** Position in `order`. */
  index: number;
  /** 1: every card; 2: the ones not known in round 1. */
  round: number;
  status: Record<string, CardStatus>;
  startedAt: number;
  finishedAt: number | null;
  updatedAt: number;
}

export function startSession(deckId: string, cardIds: string[], now: number = Date.now()): FlashcardSession {
  return { id: deckId, order: [...cardIds], index: 0, round: 1, status: {}, startedAt: now, finishedAt: null, updatedAt: now };
}

/** The card ids still to answer this round, the current one first. */
export function remaining(session: FlashcardSession): string[] {
  return session.order.slice(session.index);
}

export function counts(session: FlashcardSession, cardIds: string[]): { known: number; unknown: number } {
  let known = 0;
  let unknown = 0;
  for (const id of cardIds) {
    if (session.status[id] === "known") known += 1;
    else if (session.status[id] === "unknown") unknown += 1;
  }
  return { known, unknown };
}

/**
 * The answer for the current card. At the end of round 1 the unknown cards
 * come back as round 2; at the end of round 2 (or with nothing unknown) the
 * session is finished.
 */
export function answer(session: FlashcardSession, known: boolean, now: number = Date.now()): FlashcardSession {
  const cardId = session.order[session.index];
  if (!cardId || session.finishedAt) return session;
  const status = { ...session.status, [cardId]: known ? ("known" as const) : ("unknown" as const) };
  const index = session.index + 1;
  if (index < session.order.length) return { ...session, status, index, updatedAt: now };

  const unknown = session.order.filter((id) => status[id] === "unknown");
  if (session.round === 1 && unknown.length > 0) {
    return { ...session, status, order: unknown, index: 0, round: 2, updatedAt: now };
  }
  return { ...session, status, index, finishedAt: now, updatedAt: now };
}

/** The rest of this round in a new order; answered cards stay where they were. */
export function shuffleRest(session: FlashcardSession, random: () => number = Math.random): FlashcardSession {
  const rest = remaining(session);
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return { ...session, order: [...session.order.slice(0, session.index), ...rest], updatedAt: Date.now() };
}

/** Another pass with only the cards still unknown. */
export function repeatUnknown(session: FlashcardSession, now: number = Date.now()): FlashcardSession {
  const unknown = Object.keys(session.status).filter((id) => session.status[id] === "unknown");
  return { ...session, order: unknown, index: 0, round: 2, finishedAt: null, startedAt: now, updatedAt: now };
}

/** A session that still fits the deck (cards may have been removed or the deck replaced). */
export function fitsDeck(session: FlashcardSession, cardIds: string[]): boolean {
  const ids = new Set(cardIds);
  return session.order.length > 0 && session.order.every((id) => ids.has(id));
}

function readAll(): FlashcardSession[] {
  const stored = userStore.get<unknown>(FLASHCARD_SESSIONS_KEY, []);
  return Array.isArray(stored) ? (stored as FlashcardSession[]) : [];
}

export function loadSession(deckId: string): FlashcardSession | null {
  if (typeof window === "undefined") return null;
  return readAll().find((session) => session?.id === deckId) ?? null;
}

export function saveSession(session: FlashcardSession): void {
  if (typeof window === "undefined") return;
  const others = readAll().filter((item) => item?.id !== session.id);
  userStore.set(FLASHCARD_SESSIONS_KEY, [session, ...others].slice(0, FLASHCARD_SESSIONS_LIMIT));
}
