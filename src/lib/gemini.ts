import { generateObject, generateText, type ModelMessage } from "ai";
import { z } from "zod";
import { getConfiguredProviders } from "@/lib/ai/llm-providers";
import { requireAtLeastOneLlmProvider } from "@/lib/ai/llm-providers";
import { runWithProviderFallback } from "@/lib/ai/llm-fallback";
import { llmTextStreamResponse, type LlmStreamRequest } from "@/lib/ai/llm-stream";

export const FRIENDLY_AI_ERROR_MESSAGE =
  "AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.";

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

  const status = extractStatusCode(error);
  if (
    status === 429 ||
    text.includes("quota") ||
    text.includes("RESOURCE_EXHAUSTED")
  ) {
    return "AI პროვაიდერების ლიმიტი ამოიწურა. სცადე ცოტა მოგვიანებით ან დაამატე სხვა გასაღები (Gemini / OpenAI / Anthropic).";
  }

  if (status === 503 || text.includes("high demand")) {
    return "AI დროებით დატვირთულია. სისტემა ავტომატურად სცადებს სხვა მოდელს — სცადე 1-2 წუთში.";
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
  return Response.json(
    { error: buildFriendlyError(error), message: buildFriendlyError(error) },
    { status: 500 },
  );
}

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
}

export async function generateGeminiObject({
  schema,
  system,
  prompt,
  messages,
  temperature = 0.35,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        schema: schema as any,
        system,
        temperature,
        ...promptOrMessages,
      });
      return object;
    },
    "generateGeminiObject",
  );
}

export async function generateLlmText({
  system,
  prompt,
  temperature = 0.35,
}: {
  system?: string;
  prompt: string;
  temperature?: number;
}): Promise<string> {
  requireAtLeastOneLlmProvider();
  const providers = getConfiguredProviders();

  return runWithProviderFallback(
    providers,
    async (provider) => {
      const { text } = await generateText({
        model: provider.getModel(),
        system,
        prompt,
        temperature,
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
