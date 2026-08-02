import type { LlmProviderId } from "@/lib/ai/provider-types";
import type { AdminAiSettings } from "./types";

let runtimeAi: AdminAiSettings | null = null;

export function applyRuntimeAiSettings(ai: AdminAiSettings): void {
  runtimeAi = { ...ai };
}

export function clearRuntimeAiSettings(): void {
  runtimeAi = null;
}

const PROVIDER_SETTING_KEY: Record<LlmProviderId, keyof AdminAiSettings> = {
  gemini: "googleGenerativeAiApiKey",
  openai: "openaiApiKey",
  anthropic: "anthropicApiKey",
};

export function getRuntimeApiKey(id: LlmProviderId): string | undefined {
  const value = runtimeAi?.[PROVIDER_SETTING_KEY[id]]?.trim();
  return value || undefined;
}

export function getRuntimeProviderOrder(): string | undefined {
  return runtimeAi?.providerOrder?.trim() || undefined;
}

export function getRuntimeModel(id: LlmProviderId, fallback: string): string {
  const value =
    id === "gemini"
      ? runtimeAi?.geminiModel
      : id === "openai"
        ? runtimeAi?.openaiModel
        : runtimeAi?.anthropicModel;
  return value?.trim() || fallback;
}
