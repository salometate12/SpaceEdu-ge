export const PREMIUM_ASSISTANT_PATHS = [
  "/lit-assistant",
  "/history-assistant",
  "/english-assistant",
  "/civics-assistant",
] as const;

export type PremiumAssistantPath = (typeof PREMIUM_ASSISTANT_PATHS)[number];

export function isPremiumAssistantPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return PREMIUM_ASSISTANT_PATHS.includes(pathname as PremiumAssistantPath);
}
