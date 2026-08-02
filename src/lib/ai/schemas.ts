import { z } from "zod";

export const generatedFlashcardsSchema = z.object({
  deckTitle: z.string().describe("კოლოფის სათაური ქართულად"),
  deckDescription: z.string().describe("კოლოფის მოკლე აღწერა ქართულად"),
  cards: z
    .array(
      z.object({
        question: z.string().describe("კითხვა ქართულად"),
        answer: z.string().describe("პასუხი ქართულად"),
      }),
    )
    .min(5)
    .max(25),
});

export type GeneratedFlashcards = z.infer<typeof generatedFlashcardsSchema>;
