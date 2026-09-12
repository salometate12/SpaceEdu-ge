import { POST as aiPost } from "@/app/api/ai/route";
import { enforceJsonBodyLimit } from "@/lib/request-limits";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** @deprecated Prefer POST /api/ai with pageType "ai-teacher" */
export async function POST(request: Request) {
  const tooLarge = enforceJsonBodyLimit(request);
  if (tooLarge) return tooLarge;

  const body = (await request.json()) as {
    subject?: string;
    material?: string;
    message?: string;
    prompt?: string;
  };

  const proxied = new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pageType: "ai-teacher",
      payload: {
        subject: body.subject ?? "General",
        material: body.material,
        message: body.message ?? body.prompt ?? "",
      },
      responseMode: "stream",
    }),
  });

  return aiPost(proxied);
}
