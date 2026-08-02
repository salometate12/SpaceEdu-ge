import { z } from "zod";
import { MAX_STUDY_PLAN_DAYS, studyPlanDaysToGenerate } from "./study-plan-days";

export const StudyPlanRequestSchema = z
  .object({
    subject: z.string().min(1),
    topics: z.string().min(1),
    examDate: z.string().min(1),
    hoursPerDay: z.number().min(1).max(8),
    preparationLevel: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const days = studyPlanDaysToGenerate(data.examDate);
    if (days < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["examDate"],
        message: "გამოცდის თარიღი უნდა იყოს დღევანდელზე მომავალში.",
      });
    }
  });

export { MAX_STUDY_PLAN_DAYS };

export type StudyPlanRequest = z.infer<typeof StudyPlanRequestSchema>;

export const StudyPlanResponseSchema = z.object({
  plan: z.array(
    z.object({
      date: z.string(),
      day_name: z.string(),
      topics: z.array(z.string()),
      hours: z.number(),
      tasks: z.array(z.string()),
      focus_level: z.enum(["high", "medium", "review"]),
    }),
  ),
  total_days: z.number(),
  advice: z.string(),
});

export type StudyPlanResponse = z.infer<typeof StudyPlanResponseSchema>;
