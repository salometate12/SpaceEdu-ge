import {
  getConfiguredProviders,
  PROVIDER_ENV_VAR_NAMES,
  type LlmProviderId,
} from "@/lib/ai/llm-providers";

/**
 * Temporary diagnostics — logs only when env vars are missing (never logs key values).
 */
export function logMissingAiEnvKeys(routeScope: string): void {
  for (const [providerId, envName] of Object.entries(PROVIDER_ENV_VAR_NAMES) as [
    LlmProviderId,
    string,
  ][]) {
    if (!process.env[envName]?.trim()) {
      console.warn(`[${routeScope}] env ${envName} (${providerId}) is NOT defined`);
    }
  }

  const configured = getConfiguredProviders();
  if (configured.length === 0) {
    console.error(
      `[${routeScope}] No LLM providers available — add at least one API key in Vercel env`,
    );
    return;
  }

  if (configured.length === 1) {
    console.warn(
      `[${routeScope}] Only one LLM provider configured (${configured[0].id}) — quota failover will not help until a second key is added`,
    );
  }
}
