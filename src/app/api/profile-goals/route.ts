import { z } from "zod";
import { enforceJsonBodyLimit } from "@/lib/request-limits";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireApiKey } from "@/lib/ai/parse-form-data";
import { errorJsonResponse, generateGeminiObject } from "@/lib/gemini";
import { ProfileGoalsSchema } from "@/lib/ai/profile-goals-schema";

export const maxDuration = 120;

const BodySchema = z.object({
  prompt: z.string().min(1),
});

export async function POST(request: Request) {
  const tooLarge = enforceJsonBodyLimit(request);
  if (tooLarge) return tooLarge;
  const limited = await enforceRateLimit(request, "ai");
  if (limited) return limited;

  try {
    requireApiKey("profile-goals");
    const body = BodySchema.parse(await request.json());

    const object = (await generateGeminiObject({
      schema: ProfileGoalsSchema,
      system: "შენ ქმნი მოკლე, პრაქტიკულ ყოველდღიურ სასწავლო მიზნებს ქართულად.",
      prompt: body.prompt,
      temperature: 0.3,
    })) as z.infer<typeof ProfileGoalsSchema>;

    return Response.json(object);
  } catch (error) {
    return errorJsonResponse(error, "profile-goals");
  }
}
