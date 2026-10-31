import { z } from "zod";

/** The sections the student can ask for („რა გჭირდება“); requirements always come. */
export const TASK_SECTIONS = ["steps", "ideas", "tips", "presentation"] as const;
export type TaskSection = (typeof TASK_SECTIONS)[number];
export const DEFAULT_TASK_SECTIONS: TaskSection[] = ["steps", "ideas", "tips"];

export const TASK_TYPES = [
  { id: "design", label: "დიზაინი" },
  { id: "code", label: "კოდი" },
  { id: "writing", label: "წერითი" },
  { id: "research", label: "კვლევა" },
  { id: "presentation", label: "პრეზენტაცია" },
  { id: "other", label: "სხვა" },
] as const;
export type TaskType = (typeof TASK_TYPES)[number]["id"];

const StepSchema = z.object({ title: z.string(), detail: z.string() });
const IdeaSchema = z.object({ title: z.string(), description: z.string(), tags: z.array(z.string()) });
const TipSchema = z.object({ label: z.string(), text: z.string() });
const SlideSchema = z.object({ title: z.string(), minutes: z.number(), say: z.string() });

/**
 * The model's answer, with only the sections asked for. Every key is
 * required (OpenAI's strict mode); `grading` may be null. Step dates are
 * not the model's: the server spreads them up to the due date.
 */
export function buildTaskHelperSchema(sections: TaskSection[]) {
  return z.object({
    title: z.string(),
    requirements: z.array(z.string()).min(1).max(10),
    grading: z.string().nullable(),
    ...(sections.includes("steps") ? { steps: z.array(StepSchema).min(2).max(10) } : {}),
    ...(sections.includes("ideas") ? { ideas: z.array(IdeaSchema).min(1).max(5) } : {}),
    ...(sections.includes("tips") ? { tips: z.array(TipSchema).min(1).max(8) } : {}),
    ...(sections.includes("presentation") ? { presentation: z.object({ slides: z.array(SlideSchema).min(2).max(20) }) } : {}),
    followUp: z.object({ question: z.string(), options: z.array(z.string()).max(4) }),
  });
}

/** What the page gets: the model's answer with the dates added. */
export interface TaskHelperResult {
  title: string;
  requirements: string[];
  grading?: string;
  steps?: { title: string; detail: string; date?: string }[];
  ideas?: { title: string; description: string; tags: string[] }[];
  tips?: { label: string; text: string }[];
  presentation?: { slides: { title: string; minutes: number; say: string }[] };
  followUp: { question: string; options: string[] };
}

/** The model's answer (nulls already dropped): the result without step dates. */
export type TaskHelperModelAnswer = Omit<TaskHelperResult, "steps"> & { steps?: { title: string; detail: string }[] };

export function taskHelperJsonInstructions(sections: TaskSection[]): string {
  return [
    "Return ONLY valid JSON matching the schema.",
    'title: a short Georgian title of the assignment, e.g. „პოსტერი: ეკოლოგია ქალაქში“.',
    "requirements: 3 to 8 requirements taken from the assignment text only; for anything unclear write „დააზუსტე ლექტორთან: …“.",
    "grading: the grading rule if the assignment states one, otherwise null.",
    sections.includes("steps") ? "steps: 4 to 8 steps in order, each with a short title and a one or two sentence detail. Do not write dates." : "",
    sections.includes("ideas") ? "ideas: exactly 3 clearly different ideas, each with a title, a two or three sentence description and 2 or 3 short tags." : "",
    sections.includes("tips") ? "tips: 3 to 5 tips, each with a short bold label and a sentence of text." : "",
    sections.includes("presentation") ? "presentation.slides: the slide structure, each with a title, the minutes it takes and what to say (first person)." : "",
    "followUp: one question that moves the student to the next step, with 2 or 3 short quick replies.",
    "Write every string in natural Georgian, without dashes.",
  ]
    .filter(Boolean)
    .join("\n");
}
