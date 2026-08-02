import {
  buildLitSearchUserPrompt,
  LIT_SEARCH_SYSTEM_PROMPT,
} from "@/lib/ai/lit-assistant-prompts";
import { requireApiKey } from "@/lib/ai/parse-form-data";
import { errorJsonResponse, llmTextStreamResponse } from "@/lib/gemini";
import {
  getSmartSpaceSystemInstruction,
  normalizeSmartSpace,
} from "@/lib/smart-space";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    requireApiKey("lit-assistant");

    const body = (await request.json()) as { topic?: string; space?: string };
    const topic = body.topic?.trim();
    const space = normalizeSmartSpace(body.space);
    const spaceInstruction = getSmartSpaceSystemInstruction(space);
    const systemPrompt = spaceInstruction
      ? `${LIT_SEARCH_SYSTEM_PROMPT}\n\n${spaceInstruction}`
      : LIT_SEARCH_SYSTEM_PROMPT;

    if (!topic) {
      return Response.json(
        { error: "ლიტერატურული თემა სავალდებულოა" },
        { status: 400 },
      );
    }

    if (topic.length > 500) {
      return Response.json(
        { error: "თემა ძალიან გრძელია (მაქს. 500 სიმბოლო)" },
        { status: 400 },
      );
    }

    return llmTextStreamResponse({
      system: systemPrompt,
      prompt: buildLitSearchUserPrompt(topic),
      temperature: 0.35,
    });
  } catch (error) {
    return errorJsonResponse(error, "lit-assistant");
  }
}
