import { sanitizeChatMarkdown } from "@/lib/ai/sanitize-chat-markdown";

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
  // The raw text is kept apart from what's shown: cleaning runs on the
  // whole raw text each time, so a wrapper fence opened in one chunk can be
  // recognised when it closes in a later one.
  let raw = "";
  let result = "";

  const emit = () => {
    result = options.sanitizeMarkdown ? sanitizeChatMarkdown(raw) : raw;
    options.onChunk?.(result);
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += decoder.decode(value, { stream: true });
      emit();
    }

    const flushed = decoder.decode();
    if (flushed) {
      raw += flushed;
      emit();
    }
  } catch (error) {
    if (result.trim()) {
      return result;
    }
    throw error;
  }

  return result;
}
