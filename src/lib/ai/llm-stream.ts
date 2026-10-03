import { streamText, type ModelMessage, type ToolSet } from "ai";
import { getConfiguredProviders } from "@/lib/ai/llm-providers";
import {
  LlmChainError,
  logProviderFailure,
  shouldSkipProvider,
  shouldTryNextProvider,
  type ProviderAttempt,
} from "@/lib/ai/llm-fallback";
import { aiStreamHeaders } from "@/lib/ai/assistant-text-stream";
import { formatUrlSources } from "@/lib/history-sources";
import {
  buildFriendlyError,
  FRIENDLY_AI_ERROR_MESSAGE,
  LLM_MAX_RETRIES,
} from "@/lib/gemini";

const SOURCES_MARKER = "\x1ESOURCES\x1E";

export interface LlmStreamRequest {
  system: string;
  prompt?: string;
  messages?: ModelMessage[];
  temperature?: number;
  /** Only applied when provider is Gemini (e.g. Google Search). */
  geminiTools?: ToolSet;
  appendSources?: boolean;
}

/**
 * Streams plain text, trying each configured provider until one succeeds.
 */
export function createFallbackLlmPlainTextStream(
  request: LlmStreamRequest,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const providers = getConfiguredProviders();

  return new ReadableStream({
    async start(controller) {
      if (providers.length === 0) {
        controller.enqueue(
          encoder.encode(
            "AI გასაღები არ არის კონფიგურირებული. დაამატე Gemini, OpenAI ან Anthropic API გასაღები.",
          ),
        );
        controller.close();
        return;
      }

      console.info(
        `[llm-stream] LLM failover chain: ${providers.map((p) => `${p.id}:${p.model}`).join(" → ")}`,
      );

      const attempts: ProviderAttempt[] = [];
      const chainError = () =>
        attempts.length === 1 ? attempts[0].error : new LlmChainError(attempts);

      for (const provider of providers) {
        if (shouldSkipProvider(provider, attempts)) continue;
        const startedAt = Date.now();

        try {
          const promptOrMessages =
            request.messages && request.messages.length > 0
              ? { messages: request.messages }
              : { prompt: request.prompt ?? "" };

          const result = streamText({
            model: provider.getModel(),
            maxRetries: LLM_MAX_RETRIES,
            system: request.system,
            temperature: request.temperature ?? 0.3,
            tools:
              provider.id === "gemini" ? request.geminiTools : undefined,
            ...promptOrMessages,
          });

          let wroteText = false;

          try {
            for await (const chunk of result.textStream) {
              wroteText = true;
              controller.enqueue(encoder.encode(chunk));
            }
          } catch (streamError) {
            if (wroteText) throw streamError;
            throw streamError;
          }

          if (!wroteText) {
            const fallbackText = (await result.text).trim();
            if (fallbackText) {
              controller.enqueue(encoder.encode(fallbackText));
              wroteText = true;
            }
          }

          if (!wroteText) {
            throw new Error("empty model response");
          }

          if (request.appendSources && provider.id === "gemini") {
            try {
              const rawSources = await result.sources;
              const payload = formatUrlSources(rawSources);
              if (payload.length > 0) {
                controller.enqueue(
                  encoder.encode(
                    `${SOURCES_MARKER}${JSON.stringify(payload)}`,
                  ),
                );
              }
            } catch (sourcesError) {
              console.error("[llm-stream] sources failed", sourcesError);
            }
          }

          if (attempts.length > 0) {
            console.info(
              `[llm-stream] stream succeeded via fallback: ${provider.id}:${provider.model}`,
            );
          }

          controller.close();
          return;
        } catch (error) {
          attempts.push({ provider: provider.id, model: provider.model, error });
          logProviderFailure("llm-stream", provider, error, startedAt);

          if (!shouldTryNextProvider(error)) {
            controller.enqueue(encoder.encode(buildFriendlyError(chainError())));
            controller.close();
            return;
          }
        }
      }

      controller.enqueue(
        encoder.encode(
          attempts.length > 0
            ? buildFriendlyError(chainError())
            : FRIENDLY_AI_ERROR_MESSAGE,
        ),
      );
      controller.close();
    },
  });
}

export function llmTextStreamResponse(request: LlmStreamRequest): Response {
  return new Response(createFallbackLlmPlainTextStream(request), {
    headers: aiStreamHeaders(),
  });
}
