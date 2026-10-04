import { z } from "zod";
import type { LlmProviderEntry } from "@/lib/ai/llm-providers";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

/** The innermost error worth reading: AI SDK retry errors wrap the real
 * API error in `lastError` / `errors`. */
function innermost(error: unknown): unknown {
  const record = asRecord(error);
  if (!record) return error;
  if (record.lastError) return innermost(record.lastError);
  if (Array.isArray(record.errors) && record.errors.length > 0 && !(error instanceof LlmChainError)) {
    return innermost(record.errors[record.errors.length - 1]);
  }
  return error;
}

export function extractStatusCode(error: unknown): number | undefined {
  const record = asRecord(error);
  if (!record) return undefined;
  if (typeof record.statusCode === "number") return record.statusCode;
  if (typeof record.status === "number") return record.status;
  if (Array.isArray(record.errors) && record.errors.length > 0) {
    return extractStatusCode(record.errors[record.errors.length - 1]);
  }
  if (record.lastError) return extractStatusCode(record.lastError);
  if (record.cause) return extractStatusCode(record.cause);
  return undefined;
}

/** Provider error code, e.g. OpenAI's "invalid_json_schema" or Google's
 * "UNAVAILABLE", read from the parsed response body. */
export function extractErrorCode(error: unknown): string | undefined {
  const inner = asRecord(innermost(error));
  if (!inner) return undefined;
  const data = asRecord(inner.data);
  const body = asRecord(data?.error) ?? data;
  const code = body?.code ?? body?.status ?? body?.type ?? inner.code;
  if (typeof code === "string" && code) return code;
  if (typeof inner.responseBody === "string") {
    const match = inner.responseBody.match(/"(?:code|status|type)"\s*:\s*"([A-Za-z_]+)"/);
    if (match) return match[1];
  }
  return undefined;
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value).slice(0, 2000);
  } catch {
    return "";
  }
}

/** Everything searchable about an error: message, name, code and body. */
function errorText(error: unknown): string {
  const parts: string[] = [];
  const visit = (value: unknown, depth: number) => {
    if (depth > 4 || !value) return;
    if (typeof value === "string") {
      parts.push(value);
      return;
    }
    const record = asRecord(value);
    if (!record) return;
    if (value instanceof Error) parts.push(value.name, value.message);
    // Some stream errors arrive as plain objects (e.g. OpenAI's
    // { error: { message, code } }) — read them as JSON.
    else parts.push(safeJson(value));
    if (typeof record.responseBody === "string") parts.push(record.responseBody);
    if (typeof record.code === "string") parts.push(record.code);
    if (record.lastError) visit(record.lastError, depth + 1);
    if (record.cause) visit(record.cause, depth + 1);
  };
  visit(error, 0);
  return parts.join(" ").toLowerCase();
}

const OVERLOAD_STATUSES = new Set([502, 503, 504, 529]);

/** The model (not the request) was the problem: Google's "high demand"
 * 503s, Anthropic's 529 "overloaded" and the like. */
export function isOverloadError(error: unknown): boolean {
  const status = extractStatusCode(error);
  if (status && OVERLOAD_STATUSES.has(status)) return true;
  const text = errorText(error);
  return (
    text.includes("high demand") ||
    text.includes("overloaded") ||
    text.includes("unavailable") ||
    text.includes("capacity")
  );
}

/** The account ran out: rate limit, quota or no credits left. */
export function isQuotaError(error: unknown): boolean {
  if (extractStatusCode(error) === 429) return true;
  const text = errorText(error);
  return (
    text.includes("quota") ||
    text.includes("resource_exhausted") ||
    text.includes("credit balance") ||
    text.includes("credit_balance") ||
    text.includes("no credits") ||
    text.includes("billing") ||
    text.includes("insufficient_quota")
  );
}

/**
 * Errors one provider can't handle but another may: its own JSON-schema
 * rules, request limits, context window, or an answer that didn't fit the
 * schema. These come back as 400s, but they aren't the user's fault.
 */
function isProviderSpecificRequestError(error: unknown): boolean {
  const text = errorText(error);
  return (
    text.includes("invalid_json_schema") ||
    text.includes("invalid schema") ||
    text.includes("invalid_request_error") ||
    text.includes("invalid_argument") ||
    text.includes("context_length_exceeded") ||
    text.includes("maximum context length") ||
    text.includes("noobjectgenerated") ||
    text.includes("no object generated") ||
    text.includes("typevalidationerror") ||
    text.includes("jsonparseerror") ||
    text.includes("model not found") ||
    text.includes("not_found") ||
    text.includes("is not found") ||
    text.includes("does not exist")
  );
}

/** Whether to try the next provider in the chain. */
export function shouldTryNextProvider(error: unknown): boolean {
  // Our own input validation: every provider would get the same bad input.
  if (error instanceof z.ZodError) return false;
  if (error instanceof Error && error.name === "AbortError") return false;

  const status = extractStatusCode(error);
  if (status === 401 || status === 403 || status === 404 || status === 408) return true;
  if (status === 429 || (status !== undefined && status >= 500)) return true;
  if (isOverloadError(error) || isProviderSpecificRequestError(error)) return true;

  const text = errorText(error);
  return (
    text.includes("quota") ||
    text.includes("rate limit") ||
    text.includes("rate_limit") ||
    text.includes("resource_exhausted") ||
    text.includes("resource exhausted") ||
    text.includes("limit exceeded") ||
    text.includes("exceeded your current") ||
    text.includes("billing") ||
    text.includes("insufficient") ||
    text.includes("too many requests") ||
    text.includes("maxretriesexceeded") ||
    text.includes("failed after") ||
    text.includes("all providers failed") ||
    text.includes("empty model response")
  );
}

export interface ProviderAttempt {
  provider: string;
  model: string;
  error: unknown;
}

/** Thrown when every provider in the chain failed; keeps each attempt so
 * the user message can tell "AI is busy" from a real error. */
export class LlmChainError extends AggregateError {
  readonly attempts: ProviderAttempt[];

  constructor(attempts: ProviderAttempt[]) {
    const last = attempts[attempts.length - 1];
    super(
      attempts.map((attempt) => attempt.error),
      `All AI providers failed (${attempts.map((a) => `${a.provider}:${a.model}`).join(" → ")})` +
        (last?.error instanceof Error ? `: ${last.error.message}` : ""),
    );
    this.name = "LlmChainError";
    this.attempts = attempts;
  }
}

/** One line per failed attempt, so the cause is obvious in Vercel logs. */
export function logProviderFailure(
  scope: string,
  provider: Pick<LlmProviderEntry, "id" | "model">,
  error: unknown,
  startedAt: number,
): void {
  const inner = innermost(error);
  const message = (inner instanceof Error ? inner.message : typeof inner === "string" ? inner : safeJson(inner))
    .replace(/\s+/g, " ")
    .slice(0, 300);
  console.error(
    `[${scope}] provider=${provider.id} model=${provider.model} status=${extractStatusCode(error) ?? "-"} ` +
      `code=${extractErrorCode(error) ?? "-"} durationMs=${Date.now() - startedAt} — ${message}`,
  );
}

/** Whether to skip this entry given what went wrong before it. The
 * Gemini fallback model shares the key, so it's only worth a try when the
 * main model was overloaded or over its quota — Google's free-tier limits
 * are per model, so the lighter model may still have room. */
export function shouldSkipProvider(provider: LlmProviderEntry, attempts: ProviderAttempt[]): boolean {
  if (!provider.onlyAfterOverload) return false;
  const previous = attempts[attempts.length - 1];
  if (!previous) return true;
  return !isOverloadError(previous.error) && extractStatusCode(previous.error) !== 429;
}

export async function runWithProviderFallback<T>(
  providers: LlmProviderEntry[],
  run: (provider: LlmProviderEntry) => Promise<T>,
  scope: string,
): Promise<T> {
  if (providers.length === 0) {
    throw new Error("AI პროვაიდერი არ არის კონფიგურირებული.");
  }

  console.info(
    `[${scope}] LLM failover chain: ${providers.map((p) => `${p.id}:${p.model}`).join(" → ")}`,
  );

  const attempts: ProviderAttempt[] = [];

  for (const provider of providers) {
    if (shouldSkipProvider(provider, attempts)) continue;
    const startedAt = Date.now();

    try {
      const result = await run(provider);
      if (attempts.length > 0) {
        console.info(`[${scope}] succeeded via fallback: ${provider.id}:${provider.model}`);
      }
      return result;
    } catch (error) {
      attempts.push({ provider: provider.id, model: provider.model, error });
      logProviderFailure(scope, provider, error, startedAt);

      if (!shouldTryNextProvider(error)) {
        console.error(`[${scope}] not trying the next provider — error is not failover-eligible`);
        throw attempts.length === 1 ? error : new LlmChainError(attempts);
      }
    }
  }

  throw attempts.length === 1 ? attempts[0].error : new LlmChainError(attempts);
}
