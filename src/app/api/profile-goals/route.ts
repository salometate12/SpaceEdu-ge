import { z } from "zod";
import { requireApiKey } from "@/lib/ai/parse-form-data";
import { errorJsonResponse, generateGeminiObject } from "@/lib/gemini";

export const maxDuration = 120;

const BodySchema = z.object({
  prompt: z.string().min(1),
});

const GoalsSchema = z.object({
  goals: z.array(
    z.object({
      text: z.string(),
      type: z.enum(["quiz", "study", "read", "chat"]),
    }),
  ),
});

export async function POST(request: Request) {
  try {
    requireApiKey("profile-goals");
    const body = BodySchema.parse(await request.json());

    const object = (await generateGeminiObject({
      schema: GoalsSchema,
      system: "შენ ქმნი მოკლე, პრაქტიკულ ყოველდღიურ სასწავლო მიზნებს ქართულად.",
      prompt: body.prompt,
      temperature: 0.3,
    })) as z.infer<typeof GoalsSchema>;

    return Response.json(object);
  } catch (error) {
    return errorJsonResponse(error, "profile-goals");
  }
}
