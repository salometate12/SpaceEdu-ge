import { requireApiKey } from "@/lib/ai/parse-form-data";
import { errorJsonResponse, llmTextStreamResponse } from "@/lib/gemini";
import {
  buildCivicsUserPrompt,
  CIVICS_ASSISTANT_SYSTEM_PROMPT,
} from "@/lib/ai/civics-assistant-prompts";
import {
  getSmartSpaceSystemInstruction,
  normalizeSmartSpace,
} from "@/lib/smart-space";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    requireApiKey("civics-assistant");

    const body = (await request.json()) as { topic?: string; space?: string };
    const topic = body.topic?.trim();
    const space = normalizeSmartSpace(body.space);
    const spaceInstruction = getSmartSpaceSystemInstruction(space);
    const systemPrompt = spaceInstruction
      ? `${CIVICS_ASSISTANT_SYSTEM_PROMPT}\n\n${spaceInstruction}`
      : CIVICS_ASSISTANT_SYSTEM_PROMPT;

    if (!topic) {
      return Response.json(
        { error: "თემა ან ტერმინი სავალდებულოა" },
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
      prompt: buildCivicsUserPrompt(topic),
      temperature: 0.3,
    });
  } catch (error) {
    return errorJsonResponse(error, "civics-assistant");
  }
}
