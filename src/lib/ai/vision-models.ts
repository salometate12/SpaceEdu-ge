/**
 * Which configured models can read a photo. The defaults all do (Gemini,
 * gpt-4o-mini, Claude Haiku 4.5); a model an admin picked might not, and a
 * question with photos is never sent to one of those.
 */
import type { LlmProviderId } from "./provider-types";

const TEXT_ONLY: Record<LlmProviderId, RegExp> = {
  gemini: /embedding|aqa|imagen|tts|native-audio/i,
  openai: /^(gpt-3\.5|o1-mini|o3-mini|davinci|babbage|text-|gpt-4-0613|gpt-4-32k)/i,
  anthropic: /claude-(instant|2)|claude-3-5-haiku/i,
};

export function modelReadsImages(provider: LlmProviderId, model: string): boolean {
  return !TEXT_ONLY[provider].test(model);
}
