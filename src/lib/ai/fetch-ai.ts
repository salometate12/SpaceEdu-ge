import { readTextStream } from "@/lib/read-text-stream";
import type { AiPageType } from "./page-types";
import { aiMessageForStatus } from "./ai-messages";

export interface FetchAiOptions {
  pageType: AiPageType;
  payload: Record<string, unknown>;
  responseMode?: "stream" | "json";
  signal?: AbortSignal;
}

export class FetchAiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "FetchAiError";
  }

  /** The AI was busy: the same request is worth retrying in a minute. */
  get retryable(): boolean {
    return this.status === 503;
  }
}

export async function fetchAi({
  pageType,
  payload,
  responseMode = "stream",
  signal,
}: FetchAiOptions): Promise<Response> {
  return fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pageType, payload, responseMode }),
    signal,
  });
}

/**
 * Turns a failed /api/ai response into a FetchAiError. Uses the server's
 * JSON message when there is one; otherwise (a platform error page, a
 * timeout) picks a message from the status.
 */
export async function aiErrorFromResponse(response: Response): Promise<FetchAiError> {
  let message = aiMessageForStatus(response.status);
  try {
    const data = JSON.parse(await response.text()) as { message?: unknown; error?: unknown };
    const fromServer = [data.message, data.error].find(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    );
    if (fromServer) message = fromServer;
  } catch {
    // not JSON — keep the status-based message
  }
  return new FetchAiError(message, response.status);
}

async function parseAiError(response: Response): Promise<never> {
  throw await aiErrorFromResponse(response);
}

export async function fetchAiJson<T>(options: FetchAiOptions): Promise<T> {
  const response = await fetchAi({ ...options, responseMode: "json" });
  if (!response.ok) {
    await parseAiError(response);
  }
  return (await response.json()) as T;
}

export async function fetchAiTextStream(
  options: FetchAiOptions,
  onChunk?: (partial: string) => void,
): Promise<string> {
  const response = await fetchAi({ ...options, responseMode: "stream" });
  if (!response.ok) {
    await parseAiError(response);
  }
  return readTextStream(response, { onChunk, sanitizeMarkdown: true });
}

export interface FetchAiMultipartOptions {
  pageType: AiPageType;
  file: File;
  fields?: Record<string, string>;
  signal?: AbortSignal;
}

export async function fetchAiMultipartJson<T>(
  options: FetchAiMultipartOptions,
): Promise<T> {
  const formData = new FormData();
  formData.append("pageType", options.pageType);
  formData.append("file", options.file, options.file.name);
  if (options.fields) {
    for (const [key, value] of Object.entries(options.fields)) {
      formData.append(key, value);
    }
  }

  const response = await fetch("/api/ai", {
    method: "POST",
    body: formData,
    signal: options.signal,
  });

  if (!response.ok) {
    await parseAiError(response);
  }
  return (await response.json()) as T;
}
