import { generateObject, generateText, type ModelMessage } from "ai";
import { z } from "zod";
import { getConfiguredProviders, type LlmProviderId } from "@/lib/ai/llm-providers";
import { requireAtLeastOneLlmProvider } from "@/lib/ai/llm-providers";
import {
  extractStatusCode,
  isOverloadError,
  isQuotaError,
  LlmChainError,
  runWithProviderFallback,
} from "@/lib/ai/llm-fallback";
import { stripNulls } from "@/lib/ai/model-nulls";
import { AI_BUSY_MESSAGE, AI_UNAVAILABLE_MESSAGE } from "@/lib/ai/ai-messages";
import { llmTextStreamResponse, type LlmStreamRequest } from "@/lib/ai/llm-stream";

export const FRIENDLY_AI_ERROR_MESSAGE = AI_UNAVAILABLE_MESSAGE;
export const FRIENDLY_AI_BUSY_MESSAGE = AI_BUSY_MESSAGE;

/** Seconds a client should wait before retrying a "busy" answer. */
export const AI_BUSY_RETRY_AFTER_SECONDS = 60;

/**
 * Whether the request failed because the AI was overloaded rather than
 * because of the request. For a whole failed chain, one overloaded
 * provider is enough: the others usually failed only as a knock-on (e.g.
 * OpenAI rejecting a schema), and the user's best move is to retry soon.
 */
export function isAiBusyError(error: unknown): boolean {
  if (error instanceof LlmChainError) {
    return error.attempts.some((attempt) => isOverloadError(attempt.error));
  }
  return isOverloadError(error);
}

function extractErrorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export function buildFriendlyError(error: unknown): string {
  const text = extractErrorText(error);

  if (
    text.includes("GOOGLE_GENERATIVE_AI_API_KEY") ||
    text.includes("OPENAI_API_KEY") ||
    text.includes("ANTHROPIC_API_KEY") ||
    text.includes("AI გასაღები არ არის")
  ) {
    return "AI გასაღები არ არის კონფიგურირებული. დაამატე მინიმუმ ერთი API გასაღები (.env.local და Vercel).";
  }

  if (isAiBusyError(error)) {
    return FRIENDLY_AI_BUSY_MESSAGE;
  }

  const status = extractStatusCode(error);
  const outOfQuota =
    error instanceof LlmChainError
      ? error.attempts.every((attempt) => isQuotaError(attempt.error))
      : isQuotaError(error);
  if (
    outOfQuota ||
    status === 429 ||
    text.includes("quota") ||
    text.includes("RESOURCE_EXHAUSTED")
  ) {
    return "AI პროვაიდერების ლიმიტი ამოიწურა. სცადე ცოტა მოგვიანებით ან დაამატე სხვა გასაღები (Gemini / OpenAI / Anthropic).";
  }


  if (error instanceof z.ZodError) {
    const first = error.issues[0];
    if (first?.path.join(".") === "examDate") {
      return "გამოცდის თარიღი არასწორია ან უკვე გავიდა.";
    }
    return "შეყვანილი მონაცემები არასწორია. შეამოწმე ყველა ველი.";
  }

  if (text.includes("No object generated") || text.includes("JSON")) {
    return "AI ვერ დააგენერირა სტრუქტურირებული პასუხი. სცადე კიდევ.";
  }

  if (text.includes("AI პროვაიდერი არ არის")) {
    return text;
  }

  return FRIENDLY_AI_ERROR_MESSAGE;
}

export function errorJsonResponse(error: unknown, fallbackLogScope: string) {
  console.error(`[${fallbackLogScope}]`, error);
  const message = buildFriendlyError(error);
  if (isAiBusyError(error)) {
    return Response.json(
      { error: message, message, retryable: true },
      { status: 503, headers: { "Retry-After": String(AI_BUSY_RETRY_AFTER_SECONDS) } },
    );
  }
  return Response.json({ error: message, message }, { status: 500 });
}

/** One retry inside the AI SDK is enough: a second attempt on an
 * overloaded model rarely helps, and the provider chain is the real retry. */
export const LLM_MAX_RETRIES = 1;

interface StreamGeminiTextArgs {
  system: string;
  prompt?: string;
  messages?: ModelMessage[];
  temperature?: number;
}

/** @deprecated Use llmTextStreamResponse — kept for imports; uses multi-provider fallback. */
export function streamGeminiText(args: StreamGeminiTextArgs) {
  return llmTextStreamResponse(args);
}

interface GenerateGeminiObjectArgs {
  schema: unknown;
  system: string;
  prompt?: string;
  messages?: ModelMessage[];
  temperature?: number;
  /** Output budget for long structured answers. Capped per provider to what
   * its default model accepts; omitted, each provider's own default applies. */
  maxOutputTokens?: number;
  /** Return the model's nulls as they are instead of dropping those keys —
   * for callers whose own pipeline is null-based (the syllabus). */
  keepNulls?: boolean;
}

/** The most each provider's default model can emit in one answer. */
const PROVIDER_MAX_OUTPUT_TOKENS: Record<LlmProviderId, number> = {
  gemini: 65_536,
  openai: 16_384,
  anthropic: 64_000,
};

export async function generateGeminiObject({
  schema,
  system,
  prompt,
  messages,
  temperature = 0.35,
  maxOutputTokens,
  keepNulls = false,
}: GenerateGeminiObjectArgs): Promise<unknown> {
  requireAtLeastOneLlmProvider();
  const providers = getConfiguredProviders();
  const promptOrMessages =
    messages && messages.length > 0
      ? { messages }
      : { prompt: prompt ?? "" };

  return runWithProviderFallback(
    providers,
    async (provider) => {
      const { object } = await generateObject({
        model: provider.getModel(),
        maxRetries: LLM_MAX_RETRIES,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        schema: schema as any,
        system,
        temperature,
        ...(maxOutputTokens
          ? { maxOutputTokens: Math.min(maxOutputTokens, PROVIDER_MAX_OUTPUT_TOKENS[provider.id]) }
          : {}),
        ...promptOrMessages,
      });
      // Absent fields come back as null (see model-nulls.ts); the client
      // shape has them as missing keys.
      return keepNulls ? object : stripNulls(object);
    },
    "generateGeminiObject",
  );
}

export async function generateLlmText({
  system,
  prompt,
  messages,
  temperature = 0.35,
}: {
  system?: string;
  prompt?: string;
  messages?: ModelMessage[];
  temperature?: number;
}): Promise<string> {
  requireAtLeastOneLlmProvider();
  const providers = getConfiguredProviders();
  const promptOrMessages =
    messages && messages.length > 0 ? { messages } : { prompt: prompt ?? "" };

  return runWithProviderFallback(
    providers,
    async (provider) => {
      const { text } = await generateText({
        model: provider.getModel(),
        maxRetries: LLM_MAX_RETRIES,
        system,
        temperature,
        ...promptOrMessages,
      });
      return text;
    },
    "generateLlmText",
  );
}

export { llmTextStreamResponse, type LlmStreamRequest };

export async function callGeminiAPI(prompt: string): Promise<string> {
  try {
    return await generateLlmText({ prompt, temperature: 0.35 });
  } catch {
    throw new Error("AI ამჟამად მიუწვდომელია. გთხოვ სცადე კიდევ ერთხელ.");
  }
}
