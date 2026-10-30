import { buildGenerationFormData } from "@/lib/build-generation-form-data";
import { streamAiText } from "@/lib/assistant-stream-client";
import { parseFlashcardsIncremental, parseGeneratedFlashcardsJson, type FlashcardDraft } from "@/lib/ai/parse-flashcards-json";
import type { GeneratedFlashcards } from "@/lib/ai/schemas";
import type { UploadedData } from "@/lib/generation-input";
import { splitCardCount } from "@/lib/generation-options";
import { mergeCardParts } from "@/lib/generation-jobs";

export const GENERATION_ERROR = "ვერ შევქმენით ბარათები. სცადე თავიდან.";

export { mergeCardParts };

/**
 * Asks for the cards, in parts of at most 25 (one answer rarely holds more),
 * each later part told which questions are taken. `onProgress` gets the
 * cards ready so far, streamed, for the loader's counter and the saved
 * deck. With a `jobId` the server keeps a copy (lib/generation-jobs) and
 * finishes the parts itself if this page goes away.
 */
export async function generateFlashcards(
  data: UploadedData,
  onProgress: (ready: number, latest: FlashcardDraft | null, cards: FlashcardDraft[]) => void,
  options: { jobId?: string } = {},
): Promise<GeneratedFlashcards> {
  const counts = splitCardCount(data.cardCount);
  const parts: FlashcardDraft[][] = [];
  let first: GeneratedFlashcards | null = null;

  for (const [index, count] of counts.entries()) {
    const done = parts.flat();
    const formData = buildGenerationFormData(data, { count, avoidQuestions: done.map((card) => card.question) });
    if (options.jobId) {
      formData.append("jobId", options.jobId);
      formData.append("jobPart", String(index));
      formData.append("jobCounts", JSON.stringify(counts));
    }
    const text = await streamAiText("/api/generate-cards", formData, {
      fallbackError: GENERATION_ERROR,
      onChunk: (partial) => {
        const cards = parseFlashcardsIncremental(partial).cards;
        const soFar = mergeCardParts([...parts, cards], data.cardCount);
        onProgress(Math.min(data.cardCount, done.length + cards.length), cards.at(-1) ?? null, soFar);
      },
    });
    const parsed = parseGeneratedFlashcardsJson(text);
    first ??= parsed;
    parts.push(parsed.cards);
  }

  const cards = mergeCardParts(parts, data.cardCount);
  onProgress(cards.length, null, cards);
  return { deckTitle: first?.deckTitle ?? "AI ფლეშბარათები", deckDescription: first?.deckDescription ?? "", cards };
}
