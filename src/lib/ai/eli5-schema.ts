import { z } from "zod";

export const Eli5LevelSchema = z.enum(["kid", "school", "freshman"]);

export const Eli5RequestSchema = z.object({
  query: z.string().min(1),
  level: Eli5LevelSchema.default("kid"),
  context: z.string().optional(),
});

export type Eli5Request = z.infer<typeof Eli5RequestSchema>;

export const Eli5ResponseSchema = z.object({
  title: z.string(),
  explanation: z.string(),
  analogy: z.string(),
  rememberThis: z.string(),
  followUpQuestion: z.string().optional(),
});

export type Eli5Response = z.infer<typeof Eli5ResponseSchema>;

export const ELI5_LEVEL_LABELS: Record<Eli5Request["level"], string> = {
  kid: "5 წლის ბავშვი",
  school: "სკოლის მოსწავლე",
  freshman: "პირველკურსელი",
};
