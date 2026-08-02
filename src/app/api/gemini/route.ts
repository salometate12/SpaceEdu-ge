import { z } from "zod";
import { requireApiKey } from "@/lib/ai/parse-form-data";
import { errorJsonResponse, generateLlmText } from "@/lib/gemini";

export const maxDuration = 120;

const BodySchema = z.object({
  prompt: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    requireApiKey("gemini");
    const body = BodySchema.parse(await request.json());
    const text = await generateLlmText({
      prompt: body.prompt,
      temperature: 0.35,
    });
    return Response.json({ text });
  } catch (error) {
    return errorJsonResponse(error, "gemini");
  }
}
