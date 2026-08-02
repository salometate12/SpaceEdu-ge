import { requireApiKey } from "@/lib/ai/parse-form-data";
import { errorJsonResponse, llmTextStreamResponse } from "@/lib/gemini";
import {
  buildEnglishUserPrompt,
  ENGLISH_ASSISTANT_SYSTEM_PROMPT,
} from "@/lib/ai/english-assistant-prompts";
import {
  getSmartSpaceSystemInstruction,
  normalizeSmartSpace,
} from "@/lib/smart-space";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_QUERY_LENGTH = 8000;

export async function POST(request: Request) {
  try {
    requireApiKey("english-assistant");

    const body = (await request.json()) as { query?: string; space?: string };
    const query = body.query?.trim();
    const space = normalizeSmartSpace(body.space);
    const spaceInstruction = getSmartSpaceSystemInstruction(space);
    const systemPrompt = spaceInstruction
      ? `${ENGLISH_ASSISTANT_SYSTEM_PROMPT}\n\n${spaceInstruction}`
      : ENGLISH_ASSISTANT_SYSTEM_PROMPT;

    if (!query) {
      return Response.json(
        { error: "ტექსტი ან კითხვა სავალდებულოა" },
        { status: 400 },
      );
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return Response.json(
        { error: `ტექსტი ძალიან გრძელია (მაქს. ${MAX_QUERY_LENGTH} სიმბოლო)` },
        { status: 400 },
      );
    }

    return llmTextStreamResponse({
      system: systemPrompt,
      prompt: buildEnglishUserPrompt(query),
      temperature: 0.35,
    });
  } catch (error) {
    return errorJsonResponse(error, "english-assistant");
  }
}
