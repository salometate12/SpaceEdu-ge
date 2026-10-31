import mammoth from "mammoth";
import { z } from "zod";
import type { FilePart, ImagePart, TextPart } from "ai";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireApiKey } from "@/lib/ai/parse-form-data";
import { errorJsonResponse, generateGeminiObject } from "@/lib/gemini";
import { extractTextFromPdfBuffer } from "@/lib/ai/extract-pdf-text";
import { GEORGIAN_TASK_MENTOR_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { buildTaskHelperSchema, taskHelperJsonInstructions, TASK_TYPES, type TaskHelperModelAnswer } from "@/lib/ai/task-helper-schema";
import { GenerationInputError } from "@/lib/generation-options";
import {
  finishTaskResult,
  isIsoDate,
  localDay,
  parseSections,
  parseTaskType,
  TASK_HELPER_CREDIT_COST,
  TASK_INPUT_MAX_CHARS,
} from "@/lib/task-helper";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_TEXT_CHARS = 50_000;
/** What the model reads of a long brief or syllabus. */
const MODEL_TEXT_CHARS = 60_000;

const IMAGE_TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
const extension = (name: string) => name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";

const RequestSchema = z
  .object({
    file: z
      .instanceof(File)
      .refine((file) => file.size <= MAX_FILE_BYTES, { error: "ფაილი ძალიან დიდია. მაქსიმუმ 20 MB." })
      .refine((file) => [".pdf", ".docx", ".txt", ".md", ...Object.keys(IMAGE_TYPES)].includes(extension(file.name)), {
        error: "აქ PDF, DOCX, JPG და PNG ფაილები იტვირთება.",
      })
      .optional(),
    text: z.string().max(MAX_TEXT_CHARS, { error: "ტექსტი ძალიან გრძელია." }).optional(),
    note: z.string().max(2000).optional(),
    subject: z.string().max(120).optional(),
    dueDate: z.string().refine(isIsoDate).optional(),
    today: z.string().refine(isIsoDate).optional(),
  })
  .refine((value) => value.file || value.text?.trim(), { error: "ატვირთე დავალების ფაილი ან ჩასვი ტექსტი." });

const text = (value: FormDataEntryValue | null) => (typeof value === "string" && value.trim() ? value.trim() : undefined);

/** The assignment's text, or the file itself when it can't be read as text (a photo, a scan). */
async function readAssignment(file: File): Promise<{ text: string; part?: FilePart | ImagePart }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extension(file.name);
  if (IMAGE_TYPES[ext]) return { text: "", part: { type: "image", image: buffer, mediaType: IMAGE_TYPES[ext] } };
  if (ext === ".pdf") {
    try {
      return { text: await extractTextFromPdfBuffer(buffer) };
    } catch {
      return { text: "", part: { type: "file", data: buffer, mediaType: "application/pdf" } };
    }
  }
  if (ext === ".docx") return { text: (await mammoth.extractRawText({ buffer })).value };
  return { text: buffer.toString("utf-8") };
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "ai");
  if (limited) return limited;

  try {
    requireApiKey("task-helper");
    const formData = await request.formData();
    const file = formData.get("file");
    const parsed = RequestSchema.safeParse({
      file: file instanceof File && file.size > 0 ? file : undefined,
      text: text(formData.get("text")),
      note: text(formData.get("note")),
      subject: text(formData.get("subject")),
      dueDate: text(formData.get("dueDate")),
      today: text(formData.get("today")),
    });
    if (!parsed.success) throw new GenerationInputError(parsed.error.issues[0]?.message ?? "მოთხოვნა არასწორია.");
    const input = parsed.data;
    const sections = parseSections(formData.getAll("sections"));
    const taskType = parseTaskType(formData.get("taskType"));
    // The student's own day (time zones), else the server's.
    const today = input.today ?? localDay();

    const read = input.file ? await readAssignment(input.file) : { text: input.text ?? "" };
    const assignment = read.text.replace(/\n{3,}/g, "\n\n").trim();

    const context = [
      `დავალების ტიპი: ${TASK_TYPES.find((type) => type.id === taskType)?.label}`,
      input.subject ? `საგანი: ${input.subject}` : "",
      `დღეს: ${today}`,
      input.dueDate ? `ჩაბარება: ${input.dueDate}` : "ჩაბარების თარიღი არ არის მითითებული.",
      input.note ? `სტუდენტის შენიშვნა (რა უჭირს): ${input.note}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const content: (TextPart | FilePart | ImagePart)[] = [
      {
        type: "text",
        text: assignment
          ? `${context}\n\n--- დავალება ---\n${assignment.slice(0, MODEL_TEXT_CHARS)}\n--- დავალების დასასრული ---`
          : `${context}\n\nდავალება თან ერთვის ფაილად${input.file ? `: ${input.file.name}` : ""}.`,
      },
      ...(read.part ? [read.part] : []),
    ];

    const answer = (await generateGeminiObject({
      schema: buildTaskHelperSchema(sections),
      system: `${GEORGIAN_TASK_MENTOR_SYSTEM_PROMPT}\n\n${taskHelperJsonInstructions(sections)}`,
      messages: [{ role: "user", content }],
      temperature: 0.4,
      maxOutputTokens: 8000,
    })) as TaskHelperModelAnswer;

    const result = finishTaskResult(answer, sections, { today, due: input.dueDate });
    return Response.json(
      {
        result,
        sections,
        taskType,
        // Kept with the saved assignment, for the chat's context.
        inputText: assignment.slice(0, TASK_INPUT_MAX_CHARS),
        creditCost: TASK_HELPER_CREDIT_COST,
      },
      // What it costs (nothing is charged: there's no credit balance yet).
      { headers: { "X-Credit-Cost": String(TASK_HELPER_CREDIT_COST) } },
    );
  } catch (error) {
    if (error instanceof GenerationInputError) {
      return Response.json({ error: error.message, message: error.message }, { status: 400 });
    }
    return errorJsonResponse(error, "task-helper");
  }
}
