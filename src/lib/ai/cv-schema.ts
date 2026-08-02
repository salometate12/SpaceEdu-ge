import { z } from "zod";

export const CvProfileSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  portfolio: z.string().optional(),
  university: z.string().optional(),
  degree: z.string().optional(),
  graduationYear: z.string().optional(),
  experienceText: z.string().optional(),
  tools: z.array(z.string()).default([]),
  softSkills: z.string().optional(),
  template: z
    .enum(["minimal-tech", "creative-ui", "academic-corporate"])
    .optional(),
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
  optimizationTips: z.array(z.string()).default([]),
});

export type CvResponse = z.infer<typeof CvResponseSchema>;
