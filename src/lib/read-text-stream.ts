import { sanitizeStreamMarkdown } from "@/lib/ai/parse-flashcards-json";

export interface ReadTextStreamOptions {
  onChunk?: (partial: string) => void;
  sanitizeMarkdown?: boolean;
}

export async function readTextStream(
  response: Response,
  onChunkOrOptions?: ((partial: string) => void) | ReadTextStreamOptions,
): Promise<string> {
  const options: ReadTextStreamOptions =
    typeof onChunkOrOptions === "function"
      ? { onChunk: onChunkOrOptions }
      : (onChunkOrOptions ?? {});

  if (!response.body) {
    throw new Error("პასუხი ცარიელია");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = "";

  const emit = (value: string) => {
    const next = options.sanitizeMarkdown ? sanitizeStreamMarkdown(value) : value;
    options.onChunk?.(next);
    return next;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      result += chunk;
      result = emit(result);
    }

    const flushed = decoder.decode();
    if (flushed) {
      result += flushed;
      result = emit(result);
    }
  } catch (error) {
    if (result.trim()) {
      return result;
    }
    throw error;
  }

  return result;
}
