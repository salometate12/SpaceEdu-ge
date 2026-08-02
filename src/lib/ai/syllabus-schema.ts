import { z } from "zod";

export const SyllabusOptionsSchema = z.object({
  plan: z.boolean().optional(),
  midterms: z.boolean().optional(),
  "quiz-weeks": z.boolean().optional(),
});

export const SyllabusRequestSchema = z.object({
  fileName: z.string().optional(),
  textBody: z.string().min(50),
  options: SyllabusOptionsSchema.optional(),
});

export type SyllabusRequest = z.infer<typeof SyllabusRequestSchema>;

export const SyllabusMilestoneSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  date: z.string(),
  type: z.enum(["midterm", "quiz", "deadline"]),
});

export const SyllabusResponseSchema = z.object({
  insight: z.string(),
  milestones: z.array(SyllabusMilestoneSchema).min(1),
});

export type SyllabusResponse = z.infer<typeof SyllabusResponseSchema>;

export function normalizeSyllabusMilestones(
  milestones: SyllabusResponse["milestones"],
): Array<SyllabusResponse["milestones"][number] & { id: string }> {
  return milestones.map((item, index) => ({
    ...item,
    id: item.id?.trim() || `syllabus-ms-${index + 1}`,
  }));
}
