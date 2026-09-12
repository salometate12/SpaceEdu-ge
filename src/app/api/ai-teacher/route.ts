import { POST as aiPost } from "@/app/api/ai/route";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** @deprecated Prefer POST /api/ai with pageType "ai-teacher" */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    subject?: string;
    material?: string;
    message?: string;
    prompt?: string;
  };

  // Carry the caller's IP forward: /api/ai runs the rate-limit guard, and
  // without these headers every ai-teacher request would share one bucket.
  const forwardHeaders: Record<string, string> = { "Content-Type": "application/json" };
  const xff = request.headers.get("x-forwarded-for");
  if (xff) forwardHeaders["x-forwarded-for"] = xff;
  const xri = request.headers.get("x-real-ip");
  if (xri) forwardHeaders["x-real-ip"] = xri;

  const proxied = new Request(request.url, {
    method: "POST",
    headers: forwardHeaders,
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
