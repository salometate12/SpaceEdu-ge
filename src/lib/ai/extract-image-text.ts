import "server-only";
import { generateLlmText } from "@/lib/gemini";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MIN_EXTRACTED_CHARS = 10;

export const IMAGE_TEXT_EMPTY_ERROR =
  "სურათზე შიგთავსი ვერ ამოვიცანით. სცადე უფრო მკაფიო ან კარგად განათებული ფოტო.";

export class ImageExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageExtractError";
  }
}

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function isSupportedImage(file: File): boolean {
  if (SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase())) return true;
  return /\.(png|jpe?g|webp|heic|heif)$/i.test(file.name);
}

const VISION_SYSTEM_PROMPT =
  "You are a precise OCR and document-transcription engine. Read every piece of visible text in the provided image — a book/textbook page, handwritten note, printed document, diagram with labels, or screenshot — and transcribe it verbatim in its original language, preserving structure (headings, paragraphs, lists) as plain text. If there is little or no readable text, instead write a detailed factual description of the academic content shown (diagrams, charts, formulas). Output ONLY the transcription or description — no commentary, no markdown code fences, no preamble.";

/**
 * Turns a photo (book page, handwritten notes, screenshot, etc.) into plain
 * text via a multimodal LLM call, so it can flow through the same
 * text-based research pipeline as PDFs/TXT/MD.
 */
export async function extractTextFromImageFile(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new ImageExtractError(IMAGE_TEXT_EMPTY_ERROR);
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageExtractError("ფოტო ძალიან დიდია. მაქსიმუმ 12 MB.");
  }

  if (!isSupportedImage(file)) {
    throw new ImageExtractError("მხოლოდ PNG, JPG, WEBP ფორმატის ფოტოებია დაშვებული.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mediaType = file.type || "image/jpeg";

  let text: string;
  try {
    text = await generateLlmText({
      system: VISION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "გადაწერე ან დეტალურად აღწერე ამ სურათის შიგთავსი." },
            { type: "file", data: buffer, mediaType },
          ],
        },
      ],
      temperature: 0.1,
    });
  } catch {
    throw new ImageExtractError(IMAGE_TEXT_EMPTY_ERROR);
  }

  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length < MIN_EXTRACTED_CHARS) {
    throw new ImageExtractError(IMAGE_TEXT_EMPTY_ERROR);
  }

  return normalized.slice(0, 120_000);
}
