import { google } from "@ai-sdk/google";
import {
  buildHistoryUserPrompt,
  HISTORY_ASSISTANT_SYSTEM_PROMPT,
} from "@/lib/ai/history-assistant-prompts";
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
    requireApiKey("history-assistant");

    const body = (await request.json()) as { topic?: string; space?: string };
    const topic = body.topic?.trim();
    const space = normalizeSmartSpace(body.space);
    const spaceInstruction = getSmartSpaceSystemInstruction(space);
    const systemPrompt = spaceInstruction
      ? `${HISTORY_ASSISTANT_SYSTEM_PROMPT}\n\n${spaceInstruction}`
      : HISTORY_ASSISTANT_SYSTEM_PROMPT;

    if (!topic) {
      return Response.json(
        { error: "ისტორიული თემა სავალდებულოა" },
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
      prompt: buildHistoryUserPrompt(topic),
      temperature: 0.3,
      geminiTools: {
        google_search: google.tools.googleSearch({}),
      },
      appendSources: true,
    });
  } catch (error) {
    return errorJsonResponse(error, "history-assistant");
  }
}
