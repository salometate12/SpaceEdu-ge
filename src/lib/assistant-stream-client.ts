import { readTextStream } from "@/lib/read-text-stream";
import { FRIENDLY_AI_ERROR_MESSAGE } from "@/lib/gemini";

export const AI_STREAM_ACCEPT = "text/plain, application/json;q=0.9, */*;q=0.8";

export function aiStreamRequestHeaders(
  contentType?: "json",
): HeadersInit {
  const headers: Record<string, string> = {
    Accept: AI_STREAM_ACCEPT,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };
  if (contentType === "json") {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

export function buildAssistantJsonBody(
  bodyKey: "topic" | "query",
  value: string,
  space: string,
): string {
  return JSON.stringify({ [bodyKey]: value.trim(), space });
}

export interface PostAiTextStreamOptions {
  signal?: AbortSignal;
  fallbackError?: string;
}

export async function postAiTextStream(
  url: string,
  body: BodyInit,
  options: PostAiTextStreamOptions = {},
): Promise<Response> {
  const fallback = options.fallbackError ?? FRIENDLY_AI_ERROR_MESSAGE;
  const isJsonBody = typeof body === "string";

  const response = await fetch(url, {
    method: "POST",
    body,
    signal: options.signal,
    cache: "no-store",
    headers: aiStreamRequestHeaders(isJsonBody ? "json" : undefined),
  });

  assertPlainTextStream(response);

  if (!response.ok) {
    throw new Error(parseAssistantApiError(await response.text(), fallback));
  }

  return response;
}

export interface StreamAiTextOptions extends PostAiTextStreamOptions {
  onChunk?: (partial: string) => void;
  sanitizeMarkdown?: boolean;
  guardHtml?: boolean;
}

export async function streamAiText(
  url: string,
  body: BodyInit,
  options: StreamAiTextOptions = {},
): Promise<string> {
  const fallback = options.fallbackError ?? FRIENDLY_AI_ERROR_MESSAGE;
  const guardHtml = options.guardHtml !== false;

  const response = await postAiTextStream(url, body, {
    signal: options.signal,
    fallbackError: fallback,
  });

  const text = await readTextStream(response, {
    sanitizeMarkdown: options.sanitizeMarkdown,
    onChunk: (partial) => {
      if (guardHtml && isLikelyHtmlPayload(partial)) {
        throw new Error(fallback);
      }
      options.onChunk?.(partial);
    },
  });

  return guardHtml ? guardAssistantStreamText(text, fallback) : text;
}

export function isLikelyHtmlPayload(text: string): boolean {
  const sample = text.trimStart().slice(0, 1200).toLowerCase();
  if (!sample) return false;

  return (
    sample.startsWith("<!doctype html") ||
    sample.startsWith("<html") ||
    sample.includes("__next_f") ||
    sample.includes("$sreact") ||
    (sample.includes("/_next/static") && sample.includes("<script"))
  );
}

export function assertPlainTextStream(response: Response): void {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("text/html")) {
    throw new Error(FRIENDLY_AI_ERROR_MESSAGE);
  }
}

export function parseAssistantApiError(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  if (isLikelyHtmlPayload(trimmed)) {
    return FRIENDLY_AI_ERROR_MESSAGE;
  }

  try {
    const json = JSON.parse(trimmed) as {
      error?: string | boolean;
      message?: string;
    };
    if (typeof json.message === "string" && json.message.trim()) {
      return json.message;
    }
    if (typeof json.error === "string" && json.error.trim()) {
      return json.error;
    }
  } catch {
    if (trimmed.length < 280 && !trimmed.includes("{")) {
      return trimmed;
    }
  }

  return fallback;
}

export function guardAssistantStreamText(text: string, fallback: string): string {
  if (isLikelyHtmlPayload(text)) {
    throw new Error(fallback);
  }
  return text;
}
