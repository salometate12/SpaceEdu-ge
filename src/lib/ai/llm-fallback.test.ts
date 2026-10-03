import { APICallError, RetryError } from "ai";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { LlmProviderEntry } from "./llm-providers";
import {
  extractErrorCode,
  isOverloadError,
  LlmChainError,
  runWithProviderFallback,
  shouldTryNextProvider,
} from "./llm-fallback";
import { aiErrorFromResponse } from "./fetch-ai";
import { buildFriendlyError, errorJsonResponse, FRIENDLY_AI_BUSY_MESSAGE } from "@/lib/gemini";

vi.spyOn(console, "error").mockImplementation(() => {});
vi.spyOn(console, "info").mockImplementation(() => {});

/** What production logged on 3 Oct: Gemini overloaded after 3 attempts… */
function geminiHighDemand() {
  const apiError = new APICallError({
    message: "This model is currently experiencing high demand. Spikes in demand are usually temporary.",
    url: "https://generativelanguage.googleapis.com",
    requestBodyValues: {},
    statusCode: 503,
    responseBody: '{"error":{"code":503,"status":"UNAVAILABLE"}}',
    data: { error: { code: 503, status: "UNAVAILABLE" } },
  });
  return new RetryError({
    message: `Failed after 3 attempts. Last error: ${apiError.message}`,
    reason: "maxRetriesExceeded",
    errors: [apiError, apiError, apiError],
  });
}

/** …then OpenAI rejecting the schema outright. */
function openAiInvalidSchema() {
  return new APICallError({
    message:
      "Invalid schema for response_format 'response': In context=('properties', 'milestones', 'items'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'id'.",
    url: "https://api.openai.com/v1/chat/completions",
    requestBodyValues: {},
    statusCode: 400,
    responseBody: '{"error":{"type":"invalid_request_error","code":"invalid_json_schema"}}',
    data: { error: { type: "invalid_request_error", code: "invalid_json_schema" } },
  });
}

function provider(id: LlmProviderEntry["id"], model: string, extra: Partial<LlmProviderEntry> = {}): LlmProviderEntry {
  return { id, label: id, model, getModel: () => ({}) as never, ...extra };
}

describe("shouldTryNextProvider", () => {
  it("moves on from a provider's own schema rejection (400 invalid_json_schema)", () => {
    expect(shouldTryNextProvider(openAiInvalidSchema())).toBe(true);
  });

  it("moves on from an overloaded model (503)", () => {
    expect(shouldTryNextProvider(geminiHighDemand())).toBe(true);
  });

  it("moves on from a context-length or no-object error", () => {
    const tooLong = new APICallError({
      message: "This model's maximum context length is 128000 tokens.",
      url: "x",
      requestBodyValues: {},
      statusCode: 400,
      data: { error: { code: "context_length_exceeded" } },
    });
    expect(shouldTryNextProvider(tooLong)).toBe(true);
    const noObject = new Error("No object generated: response did not match schema.");
    noObject.name = "AI_NoObjectGeneratedError";
    expect(shouldTryNextProvider(noObject)).toBe(true);
  });

  it("stops on our own input validation", () => {
    const zod = z.object({ a: z.string() }).safeParse({});
    expect(shouldTryNextProvider(zod.error)).toBe(false);
  });

  it("reads the provider error code", () => {
    expect(extractErrorCode(openAiInvalidSchema())).toBe("invalid_json_schema");
    expect(extractErrorCode(geminiHighDemand())).toBe("UNAVAILABLE");
  });
});

describe("runWithProviderFallback", () => {
  const chain = [
    provider("gemini", "gemini-2.5-flash"),
    provider("gemini", "gemini-2.5-flash-lite", { onlyAfterOverload: true }),
    provider("openai", "gpt-4o-mini"),
    provider("anthropic", "claude"),
  ];

  it("goes flash → flash-lite → openai → anthropic until one answers", async () => {
    const tried: string[] = [];
    const result = await runWithProviderFallback(
      chain,
      async (p) => {
        tried.push(p.model);
        if (p.id === "gemini") throw geminiHighDemand();
        if (p.id === "openai") throw openAiInvalidSchema();
        return "ok";
      },
      "test",
    );
    expect(result).toBe("ok");
    expect(tried).toEqual(["gemini-2.5-flash", "gemini-2.5-flash-lite", "gpt-4o-mini", "claude"]);
  });

  it("skips the lite model when Gemini failed for another reason (e.g. a bad key)", async () => {
    const tried: string[] = [];
    await runWithProviderFallback(
      chain,
      async (p) => {
        tried.push(p.model);
        if (p.id === "gemini") {
          throw new APICallError({ message: "API key not valid", url: "x", requestBodyValues: {}, statusCode: 403 });
        }
        return "ok";
      },
      "test",
    );
    expect(tried).toEqual(["gemini-2.5-flash", "gpt-4o-mini"]);
  });

  it("keeps every attempt when the whole chain fails", async () => {
    const error = await runWithProviderFallback(
      chain.slice(0, 3),
      async (p) => {
        throw p.id === "gemini" ? geminiHighDemand() : openAiInvalidSchema();
      },
      "test",
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LlmChainError);
    expect((error as LlmChainError).attempts.map((a) => a.model)).toEqual([
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gpt-4o-mini",
    ]);
  });
});

describe("user-facing message", () => {
  const productionChain = () =>
    new LlmChainError([
      { provider: "gemini", model: "gemini-2.5-flash", error: geminiHighDemand() },
      { provider: "openai", model: "gpt-4o-mini", error: openAiInvalidSchema() },
    ]);

  it("says the AI is busy when Gemini was overloaded and OpenAI failed with a 400", () => {
    expect(isOverloadError(openAiInvalidSchema())).toBe(false);
    expect(buildFriendlyError(productionChain())).toBe(FRIENDLY_AI_BUSY_MESSAGE);
  });

  it("answers 503 with Retry-After for a busy chain", async () => {
    const response = errorJsonResponse(productionChain(), "test");
    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect((await response.json()).message).toBe(FRIENDLY_AI_BUSY_MESSAGE);
  });

  it("says the providers are out of credit when every one of them is", () => {
    const noCredit = (statusCode: number, message: string) =>
      new APICallError({ message, url: "x", requestBodyValues: {}, statusCode });
    const chain = new LlmChainError([
      { provider: "openai", model: "gpt-4o-mini", error: noCredit(429, "You have no credits remaining.") },
      { provider: "anthropic", model: "claude", error: noCredit(400, "Your credit balance is too low to access the Anthropic API.") },
    ]);
    expect(buildFriendlyError(chain)).toContain("ლიმიტი ამოიწურა");
  });

  it("keeps 500 and the general message for a non-overload failure", async () => {
    const response = errorJsonResponse(openAiInvalidSchema(), "test");
    expect(response.status).toBe(500);
  });
});

describe("aiErrorFromResponse (client)", () => {
  const html = (status: number) => new Response("<html>Gateway</html>", { status });

  it("explains non-JSON 503 / 504 / 413 / 429 by status", async () => {
    expect((await aiErrorFromResponse(html(503))).message).toBe(FRIENDLY_AI_BUSY_MESSAGE);
    expect((await aiErrorFromResponse(html(504))).message).toContain("ძალიან დიდხანს");
    expect((await aiErrorFromResponse(html(413))).message).toContain("ძალიან დიდია");
    expect((await aiErrorFromResponse(html(429))).message).toContain("ძალიან ბევრი მოთხოვნა");
  });

  it("prefers the server's JSON message and marks 503 retryable", async () => {
    const error = await aiErrorFromResponse(
      Response.json({ message: "სერვერის ტექსტი" }, { status: 503 }),
    );
    expect(error.message).toBe("სერვერის ტექსტი");
    expect(error.retryable).toBe(true);
    expect((await aiErrorFromResponse(html(500))).retryable).toBe(false);
  });
});
