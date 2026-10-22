import { z } from "zod";
import type { NullsToOptional } from "@/lib/ai/model-nulls";

/** The sections the student can ask for, in the order they're shown. */
export const RESEARCH_SECTION_KEYS = ["theses", "methodology", "literature", "criticalAnalysis", "conclusions"] as const;
export type ResearchSectionKey = (typeof RESEARCH_SECTION_KEYS)[number];

export const ResearchTogglesSchema = z.object({
  theses: z.boolean().optional(),
  methodology: z.boolean().optional(),
  literature: z.boolean().optional(),
  criticalAnalysis: z.boolean().optional(),
  conclusions: z.boolean().optional(),
});

export type ResearchToggles = z.infer<typeof ResearchTogglesSchema>;

export const ResearchRequestSchema = z.object({
  fileName: z.string().optional(),
  textBody: z.string().min(50),
  toggles: ResearchTogglesSchema.optional(),
  /** Only add these sections to an analysis the student already has (no summary, sources or quotes again). */
  addOnly: z.boolean().optional(),
});

export type ResearchRequest = z.infer<typeof ResearchRequestSchema>;

export const ResearchSourceSchema = z.object({
  citation: z.string(),
  relevance: z.string(),
});

export const ResearchQuoteSchema = z.object({
  quote: z.string(),
  context: z.string(),
  location: z.string().nullable(),
});

/**
 * One point of a section. `pages` are the PDF pages it rests on (from the
 * „--- გვერდი N ---“ markers); null where there are no pages (audio, text,
 * a photo). Nullable, not optional: OpenAI's strict mode needs every key.
 */
export const ResearchPointSchema = z.object({
  text: z.string(),
  pages: z.array(z.number()).nullable(),
});

export const ResearchCritiqueSchema = z.object({
  strengths: z.array(ResearchPointSchema),
  weaknesses: z.array(ResearchPointSchema),
});

/** A section the student didn't ask for is null. */
export const ResearchResponseSchema = z.object({
  /** The document's own title, or a short one for it. */
  title: z.string(),
  summary: z.string(),
  theses: z.array(ResearchPointSchema).nullable(),
  methodology: z.array(ResearchPointSchema).nullable(),
  literature: z.array(ResearchPointSchema).nullable(),
  criticalAnalysis: ResearchCritiqueSchema.nullable(),
  conclusions: z.array(ResearchPointSchema).nullable(),
  sources: z.array(ResearchSourceSchema),
  quotes: z.array(ResearchQuoteSchema),
});

export type ResearchPoint = NullsToOptional<z.infer<typeof ResearchPointSchema>>;
export type ResearchResponse = NullsToOptional<z.infer<typeof ResearchResponseSchema>>;

/** A section's points, flat (the critique as strengths then weaknesses). */
export function sectionPoints(result: ResearchResponse, key: ResearchSectionKey): ResearchPoint[] {
  if (key === "criticalAnalysis") {
    const critique = result.criticalAnalysis;
    return critique ? [...critique.strengths, ...critique.weaknesses] : [];
  }
  return result[key] ?? [];
}

/** „+ დამატება“: the new sections join the analysis; what was there stays as it was. */
export function mergeResearchSections(
  current: ResearchResponse,
  added: ResearchResponse,
  keys: ResearchSectionKey[],
): ResearchResponse {
  const next: ResearchResponse = { ...current };
  for (const key of keys) {
    if (key === "criticalAnalysis") {
      if (added.criticalAnalysis) next.criticalAnalysis = added.criticalAnalysis;
    } else if (added[key]) {
      next[key] = added[key];
    }
  }
  return next;
}
