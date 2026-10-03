import { zodSchema } from "ai";
import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { ChemistryOpenGraderResponseSchema } from "@/lib/ai/chemistry-open-task-grader-schema";
import { CivicsOpenGraderResponseSchema } from "@/lib/ai/civics-open-task-grader-schema";
import { CvResponseSchema } from "@/lib/ai/cv-schema";
import { Eli5ResponseSchema } from "@/lib/ai/eli5-schema";
import { EnglishWritingGraderResponseSchema } from "@/lib/ai/english-writing-task-grader-schema";
import { GeographyOpenGraderResponseSchema } from "@/lib/ai/geography-open-task-grader-schema";
import { HistoryOpenGraderResponseSchema } from "@/lib/ai/history-open-answer-grader-schema";
import { LectureNotesKeywordsSchema } from "@/lib/ai/lecture-notes-schema";
import { MathOpenGraderResponseSchema } from "@/lib/ai/math-open-problem-grader-schema";
import { PresentationResponseSchema } from "@/lib/ai/presentation-schema";
import { ProfileGoalsSchema } from "@/lib/ai/profile-goals-schema";
import { buildQuizResponseSchema } from "@/lib/ai/quiz-schema";
import { ResearchResponseSchema } from "@/lib/ai/research-platform-schema";
import { StudyPlanResponseSchema } from "@/lib/ai/study-plan-schema";
import { SyllabusAiResponseSchema } from "@/lib/ai/syllabus-schema";
import { TextEditingGraderResponseSchema } from "@/lib/ai/text-editing-grader-schema";
import { WritingTaskGraderResponseSchema } from "@/lib/ai/writing-task-grader-schema";

/**
 * Every schema handed to generateGeminiObject must also work as an OpenAI
 * strict structured-output schema — otherwise the OpenAI fallback dies with
 * a 400 "invalid_json_schema" the moment Gemini is overloaded. Strict mode
 * requires every key of every object to be listed in `required`, so
 * optional fields must be `.nullable()`, never `.optional()` / `.default()`.
 */
const MODEL_SCHEMAS: Record<string, z.ZodType> = {
  ChemistryOpenGraderResponseSchema,
  CivicsOpenGraderResponseSchema,
  CvResponseSchema,
  Eli5ResponseSchema,
  EnglishWritingGraderResponseSchema,
  GeographyOpenGraderResponseSchema,
  HistoryOpenGraderResponseSchema,
  LectureNotesKeywordsSchema,
  MathOpenGraderResponseSchema,
  PresentationResponseSchema,
  ProfileGoalsSchema,
  QuizResponseSchema: buildQuizResponseSchema(5),
  ResearchResponseSchema,
  StudyPlanResponseSchema,
  SyllabusAiResponseSchema,
  TextEditingGraderResponseSchema,
  WritingTaskGraderResponseSchema,
};

type JsonSchema = Record<string, unknown>;

/** Paths of objects whose properties aren't all required. */
function strictViolations(node: unknown, path = "$"): string[] {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap((child, i) => strictViolations(child, `${path}[${i}]`));
  const schema = node as JsonSchema;
  const found: string[] = [];

  if (schema.properties && typeof schema.properties === "object") {
    const keys = Object.keys(schema.properties as JsonSchema);
    const required = new Set(Array.isArray(schema.required) ? (schema.required as string[]) : []);
    const missing = keys.filter((key) => !required.has(key));
    if (missing.length > 0) found.push(`${path}: not required → ${missing.join(", ")}`);
    for (const [key, child] of Object.entries(schema.properties as JsonSchema)) {
      found.push(...strictViolations(child, `${path}.${key}`));
    }
  }
  for (const key of ["items", "anyOf", "oneOf", "allOf", "$defs", "definitions", "additionalProperties"]) {
    const child = schema[key];
    if (!child || typeof child !== "object") continue;
    if (key === "$defs" || key === "definitions") {
      for (const [name, def] of Object.entries(child as JsonSchema)) {
        found.push(...strictViolations(def, `${path}.${key}.${name}`));
      }
    } else {
      found.push(...strictViolations(child, `${path}.${key}`));
    }
  }
  return found;
}

describe("AI response schemas are OpenAI-strict compatible", () => {
  for (const [name, schema] of Object.entries(MODEL_SCHEMAS)) {
    it(name, async () => {
      const json = await zodSchema(schema).jsonSchema;
      expect(strictViolations(json)).toEqual([]);
    });
  }

  it("catches an optional field (self-check)", async () => {
    const { z } = await import("zod");
    const json = await zodSchema(
      z.object({ items: z.array(z.object({ id: z.string().optional(), name: z.string() })) }),
    ).jsonSchema;
    expect(strictViolations(json)).toEqual(["$.items.items: not required → id"]);
  });
});
