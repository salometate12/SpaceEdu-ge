/**
 * The session's material as the model reads it: each file split into its
 * slides (a presentation) or pages (a PDF; a DOCX or text in page-sized
 * pieces), numbered, so a plan can point at „{file}, slide 3“ and a part
 * reads only its own slides. Pure apart from the extractors.
 */
import mammoth from "mammoth";
import { extractTextFromPdfBuffer } from "@/lib/ai/extract-pdf-text";
import { fileExtension } from "@/lib/ai/extract-file-text";
import { extractPptxSlides } from "@/lib/pptx/extractText";
import { shareBudget } from "@/lib/summary-files";
import type { SourceRef } from "./schemas";

export type UnitKind = "slide" | "page";

export interface SourceUnit {
  fileId: string;
  fileName: string;
  kind: UnitKind;
  /** 1-based. */
  unit: number;
  text: string;
}

/** Text without pages (DOCX, plain text): pieces of about a page. */
const PIECE_CHARS = 2500;

export function splitIntoPieces(text: string, size = PIECE_CHARS): string[] {
  const paragraphs = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const pieces: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length > size) {
      pieces.push(current);
      current = "";
    }
    current = current ? `${current}\n\n${paragraph}` : paragraph;
    while (current.length > size * 1.5) {
      pieces.push(current.slice(0, size));
      current = current.slice(size);
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

/** A PDF's text joined with „--- გვერდი N ---“ markers (lib/ai/extract-pdf-text) back into pages. */
export function splitPdfPages(joined: string): { unit: number; text: string }[] {
  const pages: { unit: number; text: string }[] = [];
  const pattern = /--- გვერდი (\d+) ---\n/g;
  const marks = [...joined.matchAll(pattern)];
  if (marks.length === 0) return joined.trim() ? [{ unit: 1, text: joined.trim() }] : [];
  marks.forEach((mark, index) => {
    const start = (mark.index ?? 0) + mark[0].length;
    const end = index + 1 < marks.length ? marks[index + 1].index : joined.length;
    const text = joined.slice(start, end).trim();
    if (text) pages.push({ unit: Number(mark[1]), text });
  });
  return pages;
}

/** One file's slides or pages; none when its text can't be read (a scan). */
export async function fileUnits(fileId: string, name: string, buffer: Buffer): Promise<SourceUnit[]> {
  const ext = fileExtension(name);
  const make = (kind: UnitKind, items: { unit: number; text: string }[]) =>
    items.filter((item) => item.text.trim()).map((item) => ({ fileId, fileName: name, kind, unit: item.unit, text: item.text.trim() }));
  try {
    if (ext === ".pptx") {
      const slides = await extractPptxSlides(buffer);
      return make(
        "slide",
        slides.map((slide) => ({ unit: slide.number, text: [slide.title, slide.text, slide.notes ? `შენიშვნა: ${slide.notes}` : ""].filter(Boolean).join("\n") })),
      );
    }
    if (ext === ".pdf") return make("page", splitPdfPages(await extractTextFromPdfBuffer(buffer)));
    const text = ext === ".docx" ? (await mammoth.extractRawText({ buffer })).value : buffer.toString("utf-8");
    return make(
      "page",
      splitIntoPieces(text).map((piece, index) => ({ unit: index + 1, text: piece })),
    );
  } catch {
    return [];
  }
}

const unitLabel = (unit: Pick<SourceUnit, "kind" | "unit">) => `${unit.kind === "slide" ? "სლაიდი" : "გვერდი"} ${unit.unit}`;

/**
 * The material for a prompt: each file under its id and name, each slide or
 * page under its number, cut to an equal share of `budget` per file so no
 * file is left out.
 */
export function renderUnits(units: SourceUnit[], budget: number): string {
  const files = [...new Set(units.map((unit) => unit.fileId))];
  const texts = files.map((fileId) => units.filter((unit) => unit.fileId === fileId).map((unit) => `[${unitLabel(unit)}]\n${unit.text}`).join("\n\n"));
  const limits = shareBudget(
    texts.map((text) => text.length),
    budget,
  );
  return files
    .map((fileId, index) => {
      const name = units.find((unit) => unit.fileId === fileId)?.fileName ?? fileId;
      const text = texts[index].length > limits[index] ? `${texts[index].slice(0, limits[index]).trimEnd()}\n[…]` : texts[index];
      return `### ფაილი ${fileId} („${name}“)\n${text}`;
    })
    .join("\n\n");
}

/** A plan's references, only those that exist. */
export function validRefs(refs: SourceRef[], units: SourceUnit[]): SourceRef[] {
  const known = new Set(units.map((unit) => `${unit.fileId}#${unit.unit}`));
  const seen = new Set<string>();
  return refs.filter((ref) => {
    const key = `${ref.fileId}#${ref.unit}`;
    if (!known.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The slides or pages a part is about, with one on each side when they're short. */
export function unitsFor(refs: SourceRef[], units: SourceUnit[], minChars = 1200): SourceUnit[] {
  const picked = new Set(refs.map((ref) => `${ref.fileId}#${ref.unit}`));
  const chosen = units.filter((unit) => picked.has(`${unit.fileId}#${unit.unit}`));
  if (chosen.reduce((sum, unit) => sum + unit.text.length, 0) >= minChars) return chosen;
  return units.filter((unit) => chosen.some((item) => item.fileId === unit.fileId && Math.abs(item.unit - unit.unit) <= 1));
}
