/**
 * A file's text for the AI, read with the existing extractors (PDF, DOCX,
 * PPTX, plain text). Images, and PDFs whose text can't be read (scans), come
 * back as an attachment for the model to look at instead. Shared by the
 * multi-file conspectus, the task helper and the subject files' tagging.
 */
import mammoth from "mammoth";
import type { FilePart, ImagePart } from "ai";
import { extractPptxText } from "@/lib/pptx/extractText";
import { extractTextFromPdfBuffer } from "@/lib/ai/extract-pdf-text";

export const IMAGE_TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

export const fileExtension = (name: string) => name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";

export type ExtractedFile = { text: string } | { part: FilePart | ImagePart };

export async function extractFileContent(name: string, buffer: Buffer): Promise<ExtractedFile> {
  const ext = fileExtension(name);
  if (IMAGE_TYPES[ext]) return { part: { type: "image", image: buffer, mediaType: IMAGE_TYPES[ext] } };
  if (ext === ".pdf") {
    try {
      return { text: await extractTextFromPdfBuffer(buffer) };
    } catch {
      // A scan or an odd encoding: the model reads the PDF itself.
      return { part: { type: "file", data: buffer, mediaType: "application/pdf" } };
    }
  }
  if (ext === ".pptx") return { text: await extractPptxText(buffer) };
  if (ext === ".docx") return { text: (await mammoth.extractRawText({ buffer })).value };
  return { text: buffer.toString("utf-8") };
}
