/** Default model — 2.5-flash has its own free-tier quota; 2.0-flash daily quota fills up faster. */
export const DEFAULT_GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
