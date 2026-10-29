import { buildGenerationFormData } from "@/lib/build-generation-form-data";
import { streamAiText } from "@/lib/assistant-stream-client";
import { parseFlashcardsIncremental, parseGeneratedFlashcardsJson, type FlashcardDraft } from "@/lib/ai/parse-flashcards-json";
import type { GeneratedFlashcards } from "@/lib/ai/schemas";
import type { UploadedData } from "@/lib/generation-input";
import { splitCardCount } from "@/lib/generation-options";

export const GENERATION_ERROR = "ვერ შევქმენით ბარათები. სცადე თავიდან.";

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

/**
 * Asks for the cards, in parts of at most 25 (one answer rarely holds more),
 * each later part told which questions are taken. `onProgress` gets the
 * cards ready so far, streamed, for the loader's counter.
 */
export async function generateFlashcards(
  data: UploadedData,
  onProgress: (ready: number, latest: FlashcardDraft | null) => void,
): Promise<GeneratedFlashcards> {
  const counts = splitCardCount(data.cardCount);
  const parts: FlashcardDraft[][] = [];
  let first: GeneratedFlashcards | null = null;

  for (const count of counts) {
    const done = parts.flat();
    const formData = buildGenerationFormData(data, { count, avoidQuestions: done.map((card) => card.question) });
    const text = await streamAiText("/api/generate-cards", formData, {
      fallbackError: GENERATION_ERROR,
      onChunk: (partial) => {
        const cards = parseFlashcardsIncremental(partial).cards;
        onProgress(Math.min(data.cardCount, done.length + cards.length), cards.at(-1) ?? null);
      },
    });
    const parsed = parseGeneratedFlashcardsJson(text);
    first ??= parsed;
    parts.push(parsed.cards);
  }

  const cards = mergeCardParts(parts, data.cardCount);
  onProgress(cards.length, null);
  return { deckTitle: first?.deckTitle ?? "AI ფლეშბარათები", deckDescription: first?.deckDescription ?? "", cards };
}
