/**
 * A generation running on the server for a signed-in student, as one row
 * in their `user_data` (RLS: own rows only) under `spaceedu-job:{id}`. The
 * API writes it as the parts arrive and finishes it after the response
 * (`after()`), so a closed tab still gets its deck or quiz; the browser
 * reads it, moves the result into the library and deletes the row. Not a
 * synced key: the user store never pulls or pushes it.
 */
import type { FlashcardDraft } from "@/lib/ai/parse-flashcards-json";

export const GENERATION_JOB_PREFIX = "spaceedu-job:";

export type GenerationJobStatus = "generating" | "ready" | "failed";

export interface GenerationJob {
  id: string;
  kind: "cards" | "quiz";
  status: GenerationJobStatus;
  /** Cards: how many each part asks for. */
  counts?: number[];
  /** Cards: each part's cards, null until it has arrived. */
  parts?: (FlashcardDraft[] | null)[];
  deckTitle?: string;
  deckDescription?: string;
  /** Quiz: the generated questions. */
  questions?: unknown[];
  error?: string;
  /** ms */
  updatedAt: number;
}

export function jobKey(id: string): string {
  return `${GENERATION_JOB_PREFIX}${id}`;
}

/** Ids we write: from the browser, so nothing else ends up in a row's key. */
export function isJobId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9-]{8,64}$/i.test(value);
}

const normalize = (question: string) => question.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Two parts' cards as one deck: no question twice, at most `limit`. */
export function mergeCardParts(parts: FlashcardDraft[][], limit: number): FlashcardDraft[] {
  const seen = new Set<string>();
  const cards: FlashcardDraft[] = [];
  for (const card of parts.flat()) {
    const key = normalize(card.question);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    cards.push(card);
    if (cards.length >= limit) break;
  }
  return cards;
}

/** A cards job's cards so far, in order. */
export function jobCards(job: GenerationJob): FlashcardDraft[] {
  const total = (job.counts ?? []).reduce((sum, count) => sum + count, 0);
  return mergeCardParts(
    (job.parts ?? []).filter((part): part is FlashcardDraft[] => Array.isArray(part)),
    total || Number.MAX_SAFE_INTEGER,
  );
}

/** The first part that hasn't arrived, or -1 when every part is in. */
export function nextMissingPart(job: GenerationJob): number {
  const counts = job.counts ?? [];
  for (let index = 0; index < counts.length; index += 1) {
    if (!Array.isArray(job.parts?.[index])) return index;
  }
  return -1;
}

/** One part arrived: recorded, and the job is ready when it was the last. */
export function withPart(
  job: GenerationJob,
  index: number,
  cards: FlashcardDraft[],
  meta: { deckTitle?: string; deckDescription?: string },
  now: number,
): GenerationJob {
  const parts = [...(job.parts ?? (job.counts ?? []).map(() => null))];
  parts[index] = cards;
  const next: GenerationJob = {
    ...job,
    parts,
    deckTitle: job.deckTitle || meta.deckTitle,
    deckDescription: job.deckDescription || meta.deckDescription,
    updatedAt: now,
  };
  return { ...next, status: nextMissingPart(next) === -1 ? "ready" : "generating" };
}

/** A generation with no word for this long is taken as lost (failed). */
export const JOB_STALE_MS = 3 * 60_000;

export function isStale(updatedAt: number | undefined, now: number): boolean {
  return !updatedAt || now - updatedAt > JOB_STALE_MS;
}
