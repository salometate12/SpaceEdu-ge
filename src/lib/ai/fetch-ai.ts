import { readTextStream } from "@/lib/read-text-stream";
import type { AiPageType } from "./page-types";

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

async function parseAiError(response: Response): Promise<never> {
  let message = "AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.";
  try {
    const data = (await response.json()) as { message?: string; error?: string };
    message = data.message ?? data.error ?? message;
  } catch {
    // ignore
  }
  throw new FetchAiError(message, response.status);
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
