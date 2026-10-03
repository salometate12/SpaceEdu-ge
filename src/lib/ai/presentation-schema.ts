import { z } from "zod";
import type { NullsToOptional } from "@/lib/ai/model-nulls";

export const PresentationQASchema = z.object({
  goal: z.string().optional(),
  audience: z.string().optional(),
  tone: z.string().optional(),
  mainPoint: z.string().optional(),
});

export const PresentationRequestSchema = z.object({
  topic: z.string().min(1),
  subject: z.string().optional(),
  slideCount: z.number().int().min(3).max(30).default(10),
  level: z.string().optional(),
  language: z.string().optional(),
  extraInstructions: z.string().optional(),
  qa: PresentationQASchema.optional(),
  templateId: z.string().optional(),
});

export type PresentationRequest = z.infer<typeof PresentationRequestSchema>;

export const GeneratedSlideSchema = z.object({
  id: z.number().int(),
  type: z.enum(["cover", "content", "image", "stats", "conclusion"]),
  slideType: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  points: z.array(z.string()).nullable(),
  photoSlot: z.string().nullable(),
});

export const PresentationResponseSchema = z.object({
  title: z.string(),
  slides: z.array(GeneratedSlideSchema).min(3),
});

export type PresentationResponse = NullsToOptional<z.infer<typeof PresentationResponseSchema>>;

/** Numbers the slides and always sends `photoSlot` (null when unused). */
export function normalizePresentationSlides(
  slides: PresentationResponse["slides"],
): Array<Omit<PresentationResponse["slides"][number], "photoSlot"> & { photoSlot: string | null }> {
  return slides.map((slide, index) => ({
    ...slide,
    id: index + 1,
    photoSlot: slide.photoSlot ?? null,
  }));
}
