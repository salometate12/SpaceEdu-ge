import { z } from "zod";
import { extractTextFromPdfFile, PdfExtractError } from "@/lib/ai/extract-pdf-text";
import { requireApiKey } from "@/lib/ai/parse-form-data";
import { errorJsonResponse, generateGeminiObject } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 120;

const MIN_QUESTION_COUNT = 3;
const MAX_QUESTION_COUNT = 25;
const DEFAULT_QUESTION_COUNT = 5;

function buildQuizResponseSchema(count: number) {
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

function parseQuestionCount(raw: FormDataEntryValue | null): number {
  if (typeof raw !== "string") return DEFAULT_QUESTION_COUNT;
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) return DEFAULT_QUESTION_COUNT;
  return Math.min(MAX_QUESTION_COUNT, Math.max(MIN_QUESTION_COUNT, value));
}

function buildQuizSystemPrompt(count: number): string {
  return `You are SpaceEdu's expert AI Examiner.
You will receive PLAIN TEXT already extracted from a PDF document (not binary data, not a file stream).
Read only that text and generate exactly ${count} highly conceptual multiple-choice active recall questions.
Return ONLY a valid JSON object matching this contract:
{
  "questions": [
    {
      "id": number,
      "questionText": "კითხვის ტექსტი ქართულად...",
      "options": ["ვარიანტი A", "ვარიანტი B", "ვარიანტი C", "ვარიანტი D"],
      "correctAnswerIndex": number (0-3),
      "explanation": "დეტალური განმარტება, თუ რატომ არის ეს პასუხი სწორი..."
    }
  ]
}
The "questions" array MUST contain exactly ${count} items — not more, not fewer.
All questionText, options, and explanation fields MUST be in beautiful Georgian.
Base every question strictly on facts present in the provided text.`;
}

function buildQuizPrompt(fileName: string, extractedText: string): string {
  return [
    `Source document: ${fileName}`,
    "Content type: plain text already extracted (UTF-8).",
    "--- BEGIN EXTRACTED TEXT ---",
    extractedText,
    "--- END EXTRACTED TEXT ---",
    "Generate the quiz JSON only from the text between the markers above.",
  ].join("\n\n");
}

const MAX_TEXT_FILE_BYTES = 2 * 1024 * 1024;
const MIN_TEXT_CHARS = 50;

function isTextFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return (
    file.type.startsWith("text/") || lower.endsWith(".txt") || lower.endsWith(".md")
  );
}

async function extractTextFromTextFile(file: File): Promise<string> {
  if (file.size > MAX_TEXT_FILE_BYTES) {
    throw new PdfExtractError("ტექსტური ფაილი ძალიან დიდია. მაქსიმუმ 2 MB.");
  }

  const raw = (await file.text()).replace(/\s+/g, " ").trim();

  if (raw.length < MIN_TEXT_CHARS) {
    throw new PdfExtractError("ფაილი ცარიელია ან ტექსტი ძალიან მოკლეა.");
  }

  return raw.slice(0, 120_000);
}

export async function POST(request: Request) {
  try {
    requireApiKey("quiz");

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return Response.json(
        {
          error: true,
          message: "მხოლოდ PDF ფაილის ატვირთვაა მხარდაჭერილი (FormData).",
        },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
      return Response.json(
        {
          error: true,
          message: "გთხოვ, ატვირთე PDF ან ტექსტური ფაილი.",
        },
        { status: 400 },
      );
    }

    const extractedText = isTextFile(fileEntry)
      ? await extractTextFromTextFile(fileEntry)
      : await extractTextFromPdfFile(fileEntry);

    const questionCount = parseQuestionCount(formData.get("questionCount"));

    const object = await generateGeminiObject({
      schema: buildQuizResponseSchema(questionCount),
      system: buildQuizSystemPrompt(questionCount),
      prompt: buildQuizPrompt(fileEntry.name, extractedText),
      temperature: 0.35,
    });

    return Response.json(object);
  } catch (error) {
    if (error instanceof PdfExtractError) {
      return Response.json(
        { error: true, message: error.message },
        { status: 400 },
      );
    }
    return errorJsonResponse(error, "quiz");
  }
}
