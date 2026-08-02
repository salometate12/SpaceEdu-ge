import { z } from "zod";

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
  body: z.string().optional(),
  points: z.array(z.string()).optional(),
  photoSlot: z.string().nullable().optional(),
});

export const PresentationResponseSchema = z.object({
  title: z.string(),
  slides: z.array(GeneratedSlideSchema).min(3),
});

export type PresentationResponse = z.infer<typeof PresentationResponseSchema>;

export function normalizePresentationSlides(
  slides: PresentationResponse["slides"],
): PresentationResponse["slides"] {
  return slides.map((slide, index) => ({
    ...slide,
    id: index + 1,
    photoSlot: slide.photoSlot ?? null,
  }));
}
