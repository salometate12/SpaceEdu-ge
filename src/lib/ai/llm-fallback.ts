import type { LlmProviderEntry } from "@/lib/ai/llm-providers";

function extractStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const record = error as Record<string, unknown>;
  if (typeof record.statusCode === "number") return record.statusCode;
  if (Array.isArray(record.errors) && record.errors.length > 0) {
    return extractStatusCode(record.errors[record.errors.length - 1]);
  }
  if (record.lastError) return extractStatusCode(record.lastError);
  if (record.cause) return extractStatusCode(record.cause);
  return undefined;
}

function extractErrorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

/** Whether to try the next provider in the chain. */
export function shouldTryNextProvider(error: unknown): boolean {
  const text = extractErrorText(error).toLowerCase();
  const status = extractStatusCode(error);

  if (status === 401 || status === 403) return true;
  if (status === 429 || status === 503 || status === 502 || status === 529) {
    return true;
  }
  if (status && status >= 500) return true;

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
    text.includes("high demand") ||
    text.includes("overloaded") ||
    text.includes("unavailable") ||
    text.includes("capacity") ||
    text.includes("too many requests") ||
    text.includes("maxretriesexceeded") ||
    text.includes("failed after") ||
    text.includes("all providers failed")
  );
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
    `[${scope}] LLM failover chain: ${providers.map((p) => p.id).join(" → ")}`,
  );

  let lastError: unknown;

  for (let index = 0; index < providers.length; index += 1) {
    const provider = providers[index];
    const hasNext = index < providers.length - 1;

    try {
      const result = await run(provider);
      if (index > 0) {
        console.info(`[${scope}] succeeded via fallback provider: ${provider.id}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      console.error(`[${scope}] provider ${provider.id} failed`, error);

      if (!hasNext || !shouldTryNextProvider(error)) {
        if (hasNext && !shouldTryNextProvider(error)) {
          console.error(
            `[${scope}] not retrying with next provider — error is not failover-eligible`,
          );
        }
        throw error;
      }

      console.warn(
        `[${scope}] provider ${provider.id} failed (failover-eligible), trying next`,
      );
    }
  }

  throw lastError;
}
