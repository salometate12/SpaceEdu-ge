import { z } from "zod";
import { resolveMilestoneIsoDate } from "@/lib/syllabus-date-utils";

export const SyllabusOptionsSchema = z.object({
  plan: z.boolean().optional(),
  midterms: z.boolean().optional(),
  "quiz-weeks": z.boolean().optional(),
});

export const SyllabusRequestSchema = z.object({
  fileName: z.string().optional(),
  textBody: z.string().min(50),
  options: SyllabusOptionsSchema.optional(),
  /** ISO (YYYY-MM-DD) date the semester begins — lets the AI (and our
   * normalization fallback) turn "Week 8" style references into real
   * calendar dates the dashboard calendar can actually place. */
  semesterStartDate: z.string().optional(),
});

export type SyllabusRequest = z.infer<typeof SyllabusRequestSchema>;

export const SyllabusMilestoneSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  date: z.string(),
  /** Week-of-semester label, e.g. "8" or "VIII" — whatever the syllabus itself says. */
  week: z.string().optional(),
  /** Short topic/chapter this milestone covers, if the syllabus states one. */
  topic: z.string().optional(),
  type: z.enum(["midterm", "quiz", "deadline"]),
});

export const SyllabusResponseSchema = z.object({
  insight: z.string(),
  milestones: z.array(SyllabusMilestoneSchema).min(1),
});

export type SyllabusResponse = z.infer<typeof SyllabusResponseSchema>;

export function normalizeSyllabusMilestones(
  milestones: SyllabusResponse["milestones"],
  semesterStartDate?: string,
): Array<SyllabusResponse["milestones"][number] & { id: string; date: string }> {
  return milestones.map((item, index) => ({
    ...item,
    id: item.id?.trim() || `syllabus-ms-${index + 1}`,
    date: resolveMilestoneIsoDate({
      rawDate: item.date,
      week: item.week,
      semesterStartDate,
      fallbackIndex: index,
    }),
  }));
}
