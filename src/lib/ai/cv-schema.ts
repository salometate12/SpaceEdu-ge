import { z } from "zod";
import type { NullsToOptional } from "@/lib/ai/model-nulls";
import { CV_TEMPLATES, normalizeCvTemplate } from "@/lib/cv-data";

export const CvProfileSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  portfolio: z.string().optional(),
  university: z.string().optional(),
  degree: z.string().optional(),
  graduationYear: z.string().optional(),
  /** Old clients: all the experience as one text (read as the first entry). */
  experienceText: z.string().optional(),
  experiences: z
    .array(z.object({ role: z.string().default(""), place: z.string().default(""), description: z.string().default("") }))
    .max(6)
    .optional(),
  tools: z.array(z.string()).default([]),
  softSkills: z.string().optional(),
  /** Old ids (minimal-tech…) still arrive from saved state; mapped to the new set. */
  template: z.preprocess((value) => (value == null ? undefined : normalizeCvTemplate(value)), z.enum(CV_TEMPLATES).optional()),
  /** The CV's language: its texts (and section titles) are written in it. */
  language: z.enum(["ka", "en"]).optional(),
  optimizationPills: z
    .object({
      ats: z.boolean().optional(),
      internship: z.boolean().optional(),
    })
    .optional(),
});

export const CvRequestSchema = z.object({
  profile: CvProfileSchema,
});

export type CvRequest = z.infer<typeof CvRequestSchema>;

export const CvResponseSchema = z.object({
  professionalSummary: z.string(),
  headline: z.string(),
  experienceBullets: z.array(z.string()).min(1),
  highlightedSkills: z.array(z.string()),
  optimizationTips: z.array(z.string()),
});

export type CvResponse = NullsToOptional<z.infer<typeof CvResponseSchema>>;
