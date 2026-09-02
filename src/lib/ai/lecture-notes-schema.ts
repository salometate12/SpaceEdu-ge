import { z } from "zod";

export const LectureNotesRequestSchema = z.object({
  mode: z.enum(["keywords", "chat"]).default("chat"),
  title: z.string().optional(),
  content: z.string().default(""),
  message: z.string().optional(),
  keyword: z.string().optional(),
});

export type LectureNotesRequest = z.infer<typeof LectureNotesRequestSchema>;

export const LectureNotesKeywordsSchema = z.object({
  keywords: z.array(z.string()).max(8),
});

export type LectureNotesKeywords = z.infer<typeof LectureNotesKeywordsSchema>;
