import { GEORGIAN_FLASHCARD_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { enforceRateLimit } from "@/lib/rate-limit";
import { FLASHCARD_JSON_OUTPUT_RULE } from "@/lib/ai/parse-flashcards-json";
import {
  parseGenerationFormData,
  requireApiKey,
} from "@/lib/ai/parse-form-data";
import { errorJsonResponse, llmTextStreamResponse } from "@/lib/gemini";
import { GenerationInputError } from "@/lib/generation-options";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "ai");
  if (limited) return limited;

  try {
    requireApiKey("generate-cards");

    const formData = await request.formData();
    const { userMessage } = await parseGenerationFormData(
      formData,
      "flashcards",
    );

    return llmTextStreamResponse({
      system: `${GEORGIAN_FLASHCARD_SYSTEM_PROMPT}\n${FLASHCARD_JSON_OUTPUT_RULE}`,
      messages: [userMessage],
      temperature: 0.4,
      // 50 Georgian cards with hints fit well inside this; it is also under every provider's cap.
      maxOutputTokens: 16_000,
    });
  } catch (error) {
    if (error instanceof GenerationInputError) {
      return Response.json({ error: error.message, message: error.message }, { status: 400 });
    }
    return errorJsonResponse(error, "generate-cards");
  }
}
