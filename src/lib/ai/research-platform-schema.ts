import { z } from "zod";

export const ResearchTogglesSchema = z.object({
  theses: z.boolean().optional(),
  methodology: z.boolean().optional(),
  literature: z.boolean().optional(),
});

export type ResearchToggles = z.infer<typeof ResearchTogglesSchema>;

export const ResearchRequestSchema = z.object({
  fileName: z.string().optional(),
  textBody: z.string().min(50),
  toggles: ResearchTogglesSchema.optional(),
});

export type ResearchRequest = z.infer<typeof ResearchRequestSchema>;

export const ResearchSourceSchema = z.object({
  citation: z.string(),
  relevance: z.string(),
});

export const ResearchQuoteSchema = z.object({
  quote: z.string(),
  context: z.string(),
  location: z.string().optional(),
});

export const ResearchResponseSchema = z.object({
  summary: z.string(),
  sources: z.array(ResearchSourceSchema).min(1),
  quotes: z.array(ResearchQuoteSchema).min(1),
  theses: z.array(z.string()).optional(),
  methodology: z.string().optional(),
  literatureReview: z.string().optional(),
});

export type ResearchResponse = z.infer<typeof ResearchResponseSchema>;
