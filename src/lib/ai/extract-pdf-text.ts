import "server-only";

const MAX_PDF_BYTES = 15 * 1024 * 1024;
const MIN_EXTRACTED_CHARS = 50;

export const PDF_TEXT_EMPTY_ERROR =
  "ფაილი ცარიელია ან ვერ მოხერხდა ტექსტის ამოცნობა";

export class PdfExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfExtractError";
  }
}

type PdfParseResult = {
  text: string;
  numpages?: number;
};

type PdfParseFn = (buffer: Buffer) => Promise<PdfParseResult>;

function normalizeExtractedText(raw: string): string {
  return raw
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeBinaryPdfDump(text: string): boolean {
  const sample = text.slice(0, 200);
  return (
    sample.startsWith("%PDF") ||
    /\/Type\s*\/XRef/i.test(sample) ||
    /endobj/i.test(sample)
  );
}

async function parsePdfBuffer(buffer: Buffer): Promise<PdfParseResult> {
  const module = await import("pdf-parse");
  const pdfParse = (module.default ?? module) as PdfParseFn;
  return pdfParse(buffer);
}

export async function extractTextFromPdfFile(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new PdfExtractError(PDF_TEXT_EMPTY_ERROR);
  }

  if (file.size > MAX_PDF_BYTES) {
    throw new PdfExtractError("PDF ფაილი ძალიან დიდია. მაქსიმუმ 15 MB.");
  }

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    throw new PdfExtractError("მხოლოდ PDF ფორმატის ფაილია დაშვებული.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let parsed: PdfParseResult;
  try {
    parsed = await parsePdfBuffer(buffer);
  } catch {
    throw new PdfExtractError(PDF_TEXT_EMPTY_ERROR);
  }

  const text = normalizeExtractedText(parsed.text ?? "");

  if (text.length < MIN_EXTRACTED_CHARS || looksLikeBinaryPdfDump(text)) {
    throw new PdfExtractError(PDF_TEXT_EMPTY_ERROR);
  }

  return text.slice(0, 120_000);
}
