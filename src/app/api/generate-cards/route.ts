import { GEORGIAN_FLASHCARD_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { FLASHCARD_JSON_OUTPUT_RULE } from "@/lib/ai/parse-flashcards-json";
import {
  parseGenerationFormData,
  requireApiKey,
} from "@/lib/ai/parse-form-data";
import { errorJsonResponse, llmTextStreamResponse } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
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
    });
  } catch (error) {
    return errorJsonResponse(error, "generate-cards");
  }
}
