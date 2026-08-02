import { GEORGIAN_SUMMARY_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import {
  parseGenerationFormData,
  requireApiKey,
} from "@/lib/ai/parse-form-data";
import { errorJsonResponse, llmTextStreamResponse } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
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
    return errorJsonResponse(error, "generate-summary");
  }
}
