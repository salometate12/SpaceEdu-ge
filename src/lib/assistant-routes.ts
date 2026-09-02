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

/**
 * Routes under the (assistants) layout that render their own complete,
 * full-bleed UI (own sidebar, own header) and should NOT also get
 * AssistantPlatformShell's generic subject-nav sidebar wrapped around
 * them. Broader than PREMIUM_ASSISTANT_PATHS on purpose — /ai-teacher
 * doesn't use the shared sidebar-guide config those routes do (see
 * assistant-sidebar-config.ts), so it isn't a "premium assistant" for
 * that config's purposes, but it still needs the same full-bleed
 * layout treatment.
 */
const FULL_BLEED_ASSISTANT_PATHS = [...PREMIUM_ASSISTANT_PATHS, "/ai-teacher"] as const;

export function isFullBleedAssistantPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (FULL_BLEED_ASSISTANT_PATHS as readonly string[]).includes(pathname);
}
