import { z } from "zod";
import type { NullsToOptional } from "@/lib/ai/model-nulls";

export const Eli5LevelSchema = z.enum(["kid", "school", "freshman"]);
export type Eli5Level = z.infer<typeof Eli5LevelSchema>;

export const Eli5RequestSchema = z.object({
  query: z.string().min(1),
  level: Eli5LevelSchema.default("kid"),
  context: z.string().optional(),
});

export type Eli5Request = z.infer<typeof Eli5RequestSchema>;

/**
 * The explanation in four parts, always. Every key is required (OpenAI's
 * strict mode); the one that may be absent is `.nullable()`.
 */
export const Eli5ResponseSchema = z.object({
  title: z.string(),
  /** An everyday-life analogy. */
  analogy: z.string(),
  /** 3–4 sentences; may contain **bold**. */
  simple: z.string(),
  /** A real example (with numbers where possible), or null when the topic has none. */
  example: z.string().nullable(),
  /** At most ~15 words. */
  oneLiner: z.string(),
});

export type Eli5Response = NullsToOptional<z.infer<typeof Eli5ResponseSchema>>;

export const ELI5_LEVELS: { id: Eli5Level; label: string; hint: string }[] = [
  { id: "kid", label: "5 წლის", hint: "როგორც 5 წლის ბავშვს" },
  { id: "school", label: "მოსწავლე", hint: "სკოლის მოსწავლისთვის" },
  { id: "freshman", label: "პირველკურსელი", hint: "უნივერსიტეტის პირველკურსელისთვის" },
];

/** „უფრო მარტივად“ (−1) / „უფრო ღრმად“ (+1); null past either end. */
export function stepEli5Level(level: Eli5Level, delta: -1 | 1): Eli5Level | null {
  const index = ELI5_LEVELS.findIndex((item) => item.id === level) + delta;
  return ELI5_LEVELS[index]?.id ?? null;
}
