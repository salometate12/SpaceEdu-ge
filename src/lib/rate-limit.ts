import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Request rate limiting for the public API routes.
 *
 * Every AI endpoint calls an LLM that costs money and draws on a shared
 * quota, and none of them require a session — so without a limit a single
 * script could run up the bill or exhaust the quota for everyone. This caps
 * how often one caller can hit them.
 *
 * Backed by Upstash Redis when configured (the only store that works across
 * Vercel's stateless function instances). With no Upstash env vars it falls
 * back to a per-instance in-memory limiter: imperfect on serverless — each
 * instance counts on its own — but a real safety net rather than nothing,
 * and it keeps local development working without any external service.
 */

type Decision = {
  success: boolean;
  /** Seconds until the caller may retry, when blocked. */
  retryAfter: number;
  limit: number;
  remaining: number;
};

/** Named buckets. Each has its own window so one abuser of AI can't also
 *  lock a different caller out of, say, the admin login attempts. */
export type RateLimitBucket = "ai" | "admin-login";

const RULES: Record<RateLimitBucket, { tokens: number; window: `${number} s` }> = {
  // A student chatting hits this a handful of times a minute; 30/min per IP
  // leaves generous room for real use while stopping scripted abuse cold.
  ai: { tokens: 30, window: "60 s" },
  // Password guessing has no legitimate high rate.
  "admin-login": { tokens: 5, window: "60 s" },
};

/* -------------------------------------------------------------------------- */
/*                              Upstash backend                               */
/* -------------------------------------------------------------------------- */

const upstashCache = new Map<RateLimitBucket, Ratelimit | null>();

function upstashLimiter(bucket: RateLimitBucket): Ratelimit | null {
  if (upstashCache.has(bucket)) return upstashCache.get(bucket) ?? null;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    upstashCache.set(bucket, null);
    return null;
  }

  const rule = RULES[bucket];
  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(rule.tokens, rule.window),
    prefix: `spaceedu:rl:${bucket}`,
    analytics: false,
  });
  upstashCache.set(bucket, limiter);
  return limiter;
}

/* -------------------------------------------------------------------------- */
/*                       In-memory fallback (per instance)                    */
/* -------------------------------------------------------------------------- */

const memory = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(bucket: RateLimitBucket, id: string): Decision {
  const rule = RULES[bucket];
  const windowMs = Number(rule.window.replace(" s", "")) * 1000;
  const key = `${bucket}:${id}`;
  const now = Date.now();
  const entry = memory.get(key);

  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, retryAfter: 0, limit: rule.tokens, remaining: rule.tokens - 1 };
  }

  entry.count += 1;
  const remaining = Math.max(0, rule.tokens - entry.count);
  const success = entry.count <= rule.tokens;
  return {
    success,
    retryAfter: success ? 0 : Math.ceil((entry.resetAt - now) / 1000),
    limit: rule.tokens,
    remaining,
  };
}

// Keep the fallback map from growing without bound under sustained traffic.
function sweepMemory() {
  if (memory.size < 5000) return;
  const now = Date.now();
  for (const [key, entry] of memory) {
    if (entry.resetAt <= now) memory.delete(key);
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Public                                    */
/* -------------------------------------------------------------------------- */

/** Best-effort client identity: the first hop in x-forwarded-for, which on
 *  Vercel is the real client IP. Falls back to a constant so a missing header
 *  shares one bucket rather than bypassing the limit entirely. */
export function clientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "anonymous";
}

/**
 * Returns a ready-to-send 429 Response when the caller is over the limit for
 * this bucket, or `null` to let the request through. Call it at the top of a
 * route and return its result when non-null.
 */
export async function enforceRateLimit(
  request: Request,
  bucket: RateLimitBucket,
  identity: string = clientId(request),
): Promise<Response | null> {
  let decision: Decision;

  const upstash = upstashLimiter(bucket);
  if (upstash) {
    const result = await upstash.limit(identity);
    decision = {
      success: result.success,
      retryAfter: Math.max(0, Math.ceil((result.reset - Date.now()) / 1000)),
      limit: result.limit,
      remaining: result.remaining,
    };
  } else {
    sweepMemory();
    decision = memoryLimit(bucket, identity);
  }

  if (decision.success) return null;

  return Response.json(
    {
      error: "too-many-requests",
      message: "მოთხოვნები ძალიან ხშირია. სცადე ცოტა ხანში.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(decision.retryAfter),
        "RateLimit-Limit": String(decision.limit),
        "RateLimit-Remaining": String(decision.remaining),
      },
    },
  );
}
