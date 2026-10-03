import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { DEFAULT_GEMINI_MODEL } from "@/lib/ai/gemini-model";
import {
  getRuntimeApiKey,
  getRuntimeModel,
  getRuntimeProviderOrder,
} from "@/lib/admin/runtime-overrides";

import type { LlmProviderId } from "./provider-types";

export type { LlmProviderId } from "./provider-types";

export const PROVIDER_ENV_VAR_NAMES: Record<LlmProviderId, string> = {
  gemini: "GOOGLE_GENERATIVE_AI_API_KEY",
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

const DEFAULT_MODELS: Record<LlmProviderId, string> = {
  gemini: DEFAULT_GEMINI_MODEL,
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-20241022",
};

function resolveModel(id: LlmProviderId): string {
  const envFallback =
    id === "gemini"
      ? DEFAULT_GEMINI_MODEL
      : id === "openai"
        ? process.env.OPENAI_MODEL?.trim() || DEFAULT_MODELS.openai
        : process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODELS.anthropic;
  return getRuntimeModel(id, envFallback);
}

/** Lighter Gemini model tried with the same key when the main one is
 * overloaded — Google's "high demand" 503s often hit one model only.
 * Not gemini-2.5-flash-lite: Google no longer serves 2.5 models to keys
 * that haven't used them before (404 "no longer available to new users"). */
export const DEFAULT_GEMINI_FALLBACK_MODEL = "gemini-3.5-flash-lite";

function resolveGeminiFallbackModel(): string {
  return process.env.GEMINI_FALLBACK_MODEL?.trim() || DEFAULT_GEMINI_FALLBACK_MODEL;
}

const DEFAULT_ORDER: LlmProviderId[] = ["gemini", "openai", "anthropic"];

function readEnvKey(id: LlmProviderId): string | undefined {
  const runtime = getRuntimeApiKey(id);
  if (runtime) return runtime;
  const value = process.env[PROVIDER_ENV_VAR_NAMES[id]]?.trim();
  return value || undefined;
}

function hasKey(id: LlmProviderId): boolean {
  return Boolean(readEnvKey(id));
}

export function isProviderConfigured(id: LlmProviderId): boolean {
  return hasKey(id);
}

export function parseProviderOrder(): LlmProviderId[] {
  const raw = getRuntimeProviderOrder() ?? process.env.AI_PROVIDER_ORDER?.trim();
  if (!raw) return DEFAULT_ORDER;

  const parsed = raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((part): part is LlmProviderId =>
      ["gemini", "openai", "anthropic"].includes(part),
    );

  return parsed.length > 0 ? parsed : DEFAULT_ORDER;
}

export interface LlmProviderEntry {
  id: LlmProviderId;
  label: string;
  /** Model id, for logs. */
  model: string;
  /** Only worth trying when the previous attempt failed because the model
   * was overloaded (the Gemini lite fallback: same key, so an auth or
   * quota error would fail it too). */
  onlyAfterOverload?: boolean;
  getModel: () => LanguageModel;
}

type GoogleClient = ReturnType<typeof createGoogleGenerativeAI>;
type OpenAiClient = ReturnType<typeof createOpenAI>;
type AnthropicClient = ReturnType<typeof createAnthropic>;

let googleClient: GoogleClient | null | undefined;
let openaiClient: OpenAiClient | null | undefined;
let anthropicClient: AnthropicClient | null | undefined;

function getGoogleClient(): GoogleClient | null {
  if (googleClient !== undefined) return googleClient;
  const apiKey = readEnvKey("gemini");
  googleClient = apiKey ? createGoogleGenerativeAI({ apiKey }) : null;
  return googleClient;
}

function getOpenAiClient(): OpenAiClient | null {
  if (openaiClient !== undefined) return openaiClient;
  const apiKey = readEnvKey("openai");
  openaiClient = apiKey ? createOpenAI({ apiKey }) : null;
  return openaiClient;
}

function getAnthropicClient(): AnthropicClient | null {
  if (anthropicClient !== undefined) return anthropicClient;
  const apiKey = readEnvKey("anthropic");
  anthropicClient = apiKey ? createAnthropic({ apiKey }) : null;
  return anthropicClient;
}

function createModel(id: LlmProviderId, modelId: string = resolveModel(id)): LanguageModel {
  if (id === "gemini") {
    const client = getGoogleClient();
    if (!client) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
    }
    return client(modelId);
  }

  if (id === "openai") {
    const client = getOpenAiClient();
    if (!client) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    return client(modelId);
  }

  const client = getAnthropicClient();
  if (!client) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  return client(modelId);
}

export function getConfiguredProviders(): LlmProviderEntry[] {
  const order = parseProviderOrder();
  const entries: LlmProviderEntry[] = [];

  for (const id of order) {
    if (!isProviderConfigured(id)) continue;
    const model = resolveModel(id);
    entries.push({
      id,
      label:
        id === "gemini"
          ? "Gemini"
          : id === "openai"
            ? "OpenAI"
            : "Anthropic",
      model,
      getModel: () => createModel(id, model),
    });
    if (id === "gemini") {
      const fallbackModel = resolveGeminiFallbackModel();
      if (fallbackModel !== model) {
        entries.push({
          id,
          label: "Gemini (fallback model)",
          model: fallbackModel,
          onlyAfterOverload: true,
          getModel: () => createModel(id, fallbackModel),
        });
      }
    }
  }

  return entries;
}

export function requireAtLeastOneLlmProvider(): void {
  if (getConfiguredProviders().length === 0) {
    throw new Error(
      "AI გასაღები არ არის კონფიგურირებული. დაამატე მინიმუმ ერთი: GOOGLE_GENERATIVE_AI_API_KEY, OPENAI_API_KEY ან ANTHROPIC_API_KEY.",
    );
  }
}

/** @internal Reset cached SDK clients (tests only). */
export function resetLlmClientsForTests(): void {
  resetLlmClients();
}

/** Clear cached LLM SDK clients after admin settings change. */
export function resetLlmClients(): void {
  googleClient = undefined;
  openaiClient = undefined;
  anthropicClient = undefined;
}
