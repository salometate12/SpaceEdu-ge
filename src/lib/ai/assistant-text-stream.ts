import type { StreamTextResult } from "ai";
import {
  buildFriendlyError,
  FRIENDLY_AI_ERROR_MESSAGE,
} from "@/lib/gemini";
import { formatUrlSources } from "@/lib/history-sources";

const SOURCES_MARKER = "\x1ESOURCES\x1E";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TextStreamResult = StreamTextResult<any, any>;

export function createAssistantPlainTextStream(
  result: TextStreamResult,
  options?: { appendSources?: boolean },
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const appendSources = options?.appendSources ?? false;

  return new ReadableStream({
    async start(controller) {
      let wroteText = false;

      try {
        for await (const chunk of result.textStream) {
          wroteText = true;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        console.error("[assistant-text-stream] textStream failed", error);
        if (!wroteText) {
          controller.enqueue(
            encoder.encode(buildFriendlyError(error)),
          );
        }
      }

      if (!wroteText) {
        try {
          const fallbackText = (await result.text).trim();
          if (fallbackText) {
            controller.enqueue(encoder.encode(fallbackText));
            wroteText = true;
          }
        } catch (error) {
          console.error("[assistant-text-stream] result.text failed", error);
        }
      }

      if (!wroteText) {
        controller.enqueue(encoder.encode(FRIENDLY_AI_ERROR_MESSAGE));
      }

      if (appendSources) {
        try {
          const rawSources = await result.sources;
          const payload = formatUrlSources(rawSources);
          if (payload.length > 0) {
            controller.enqueue(
              encoder.encode(`${SOURCES_MARKER}${JSON.stringify(payload)}`),
            );
          }
        } catch (error) {
          console.error("[assistant-text-stream] sources failed", error);
        }
      }

      controller.close();
    },
  });
}

export function aiStreamHeaders(): HeadersInit {
  return {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache, no-store, no-transform, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    Connection: "keep-alive",
    "X-Content-Type-Options": "nosniff",
  };
}

/** @deprecated Use aiStreamHeaders */
export const assistantStreamHeaders = aiStreamHeaders;

export function aiTextStreamResponse(
  result: TextStreamResult,
  options?: { appendSources?: boolean },
): Response {
  return new Response(createAssistantPlainTextStream(result, options), {
    headers: aiStreamHeaders(),
  });
}
