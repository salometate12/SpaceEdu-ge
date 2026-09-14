/**
 * A ceiling on request body size for the JSON API routes.
 *
 * The rate limiter caps how OFTEN a caller hits an AI endpoint; this caps
 * how BIG each request is. Without it, a request within the rate limit
 * could still carry a multi-megabyte string that becomes a giant LLM
 * prompt — turning 30 allowed requests a minute into a large, and
 * attacker-chosen, token bill.
 *
 * 100 KB is far more than any real prompt (~25k tokens of text) and small
 * enough that abuse is pointless. File uploads are handled separately, with
 * their own 20 MB cap in parse-form-data.ts, so this guard is for the
 * application/json routes only.
 */
export const MAX_JSON_BODY_BYTES = 100 * 1024;

/**
 * Rejects an oversized JSON body up front, by the Content-Length header, so
 * the handler never parses it. Returns a ready 413 Response when over the
 * cap, or null to proceed. Call it alongside the rate-limit guard.
 *
 * A body with no Content-Length (rare from browsers; chunked uploads) is
 * let through here — the per-field schema caps are the backstop for those.
 */
export function enforceJsonBodyLimit(
  request: Request,
  maxBytes: number = MAX_JSON_BODY_BYTES,
): Response | null {
  const header = request.headers.get("content-length");
  if (!header) return null;

  const length = Number(header);
  if (!Number.isFinite(length) || length <= maxBytes) return null;

  return Response.json(
    { error: "payload-too-large", message: "მოთხოვნა ძალიან დიდია." },
    { status: 413 },
  );
}
