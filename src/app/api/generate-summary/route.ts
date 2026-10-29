import { GEORGIAN_SUMMARY_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { enforceRateLimit } from "@/lib/rate-limit";
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
    requireApiKey("generate-summary");

    const formData = await request.formData();
    const { userMessage } = await parseGenerationFormData(formData, "summary");

    return llmTextStreamResponse({
      system: GEORGIAN_SUMMARY_SYSTEM_PROMPT,
      messages: [userMessage],
      temperature: 0.25,
    });
  } catch (error) {
    if (error instanceof GenerationInputError) {
      return Response.json({ error: error.message, message: error.message }, { status: 400 });
    }
    return errorJsonResponse(error, "generate-summary");
  }
}
