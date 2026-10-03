import { z } from "zod";

/** What the model returns for /api/quiz: exactly `count` questions. */
export function buildQuizResponseSchema(count: number) {
  return z.object({
    questions: z
      .array(
        z.object({
          id: z.number(),
          questionText: z.string(),
          options: z.array(z.string()).length(4),
          correctAnswerIndex: z.number().min(0).max(3),
          explanation: z.string(),
        }),
      )
      .length(count),
  });
}
