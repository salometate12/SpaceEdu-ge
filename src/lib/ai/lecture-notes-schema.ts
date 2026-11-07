import { z } from "zod";

export const LectureNotesRequestSchema = z.object({
  mode: z.enum(["keywords", "chat"]).default("chat"),
  title: z.string().optional(),
  content: z.string().default(""),
  message: z.string().optional(),
  keyword: z.string().optional(),
  /** „ჩემი საგნები“: the note's subject. */
  subject: z.string().max(200).optional(),
  /** „ჰკითხე ამ ჩანაწერს“: the conversation so far (the last 10 messages). */
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(12_000) }))
    .max(10)
    .default([]),
});

export type LectureNotesRequest = z.infer<typeof LectureNotesRequestSchema>;

export const LectureNotesKeywordsSchema = z.object({
  keywords: z.array(z.string()).max(8),
});

export type LectureNotesKeywords = z.infer<typeof LectureNotesKeywordsSchema>;
