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
  /** The user's photos — metadata only; the images stay in the browser. */
  photos: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        caption: z.string().max(200).optional(),
        name: z.string().max(120).optional(),
        orientation: z.enum(["landscape", "portrait", "square"]),
      }),
    )
    .max(10)
    .optional(),
});

export type PresentationRequest = z.infer<typeof PresentationRequestSchema>;

export const GeneratedSlideSchema = z.object({
  id: z.number().int(),
  type: z.enum(["cover", "content", "image", "stats", "conclusion"]),
  slideType: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  points: z.array(z.string()).nullable(),
  /** Ids of the user's photos that belong on this slide (max 2), or null. */
  photoIds: z.array(z.string()).nullable(),
});

export const PresentationResponseSchema = z.object({
  title: z.string(),
  slides: z.array(GeneratedSlideSchema).min(3),
});

export type PresentationResponse = NullsToOptional<z.infer<typeof PresentationResponseSchema>>;

/**
 * Numbers the slides and cleans the photo choices: only ids the user
 * actually sent, each on one slide (its first), at most two per slide.
 * Placing photos the AI left out happens in the browser, which has them.
 */
export function normalizePresentationSlides(
  slides: PresentationResponse["slides"],
  photoIds: readonly string[] = [],
): Array<Omit<PresentationResponse["slides"][number], "photoIds"> & { photoIds: string[] }> {
  const known = new Set(photoIds);
  const used = new Set<string>();
  return slides.map((slide, index) => {
    const ids: string[] = [];
    for (const id of slide.photoIds ?? []) {
      if (!known.has(id) || used.has(id) || ids.length >= 2) continue;
      ids.push(id);
      used.add(id);
    }
    return { ...slide, id: index + 1, photoIds: ids };
  });
}
