import { POST as aiPost } from "@/app/api/ai/route";
import { enforceJsonBodyLimit } from "@/lib/request-limits";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * @deprecated Use POST /api/ai with { pageType: "study-plan", responseMode: "json", payload }.
 * Kept as a thin proxy for backward compatibility.
 */
export async function POST(request: Request) {
  const tooLarge = enforceJsonBodyLimit(request);
  if (tooLarge) return tooLarge;

  const body = (await request.json()) as {
    subject?: string;
    topics?: string;
    examDate?: string;
    hoursPerDay?: number;
    preparationLevel?: string;
  };

  const proxied = new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pageType: "study-plan",
      responseMode: "json",
      payload: body,
    }),
  });

  return aiPost(proxied);
}
