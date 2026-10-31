/**
 * A conspectus from several files (/generate, „კონსპექტი“): the limits, the
 * cost, adding files to the list and sharing the text budget between them.
 * Used by the page and by /api/generate-summary, so both agree.
 */
import { z } from "zod";

export const SUMMARY_MAX_FILES = 5;
export const FILE_MAX_BYTES = 20 * 1024 * 1024;
export const SUMMARY_MAX_TOTAL_BYTES = 50 * 1024 * 1024;

export const TOTAL_TOO_BIG = "ჯამში 50 MB-ზე მეტია";
export const FILE_TOO_BIG = "ფაილი ძალიან დიდია. მაქსიმუმ 20 MB.";
export const TOO_MANY_FILES = `მაქსიმუმ ${SUMMARY_MAX_FILES} ფაილი.`;

/** What a summary from `fileCount` files costs: 1–3 files one credit, 4–5 two. Not charged yet: there's no credit balance. */
export function summaryCreditCost(fileCount: number): 1 | 2 {
  return fileCount >= 4 ? 2 : 1;
}

const EXTENSIONS = [".pdf", ".docx", ".pptx", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"];

export function isSummaryFile(name: string): boolean {
  const lower = name.toLowerCase();
  return EXTENSIONS.some((extension) => lower.endsWith(extension));
}

export function totalBytes(files: { size: number }[]): number {
  return files.reduce((sum, file) => sum + file.size, 0);
}

/**
 * Picked files added to the list, up to `max`: the ones that fit go in, and
 * the first problem (too big, too many, over the total) comes back to show.
 */
export function addFiles<T extends { name: string; size: number }>(
  current: T[],
  picked: T[],
  max: number,
): { files: T[]; error: string | null } {
  const files = [...current];
  let error: string | null = null;
  for (const file of picked) {
    if (files.length >= max) {
      error ??= max === 1 ? null : TOO_MANY_FILES;
      break;
    }
    if (file.size > FILE_MAX_BYTES) {
      error ??= FILE_TOO_BIG;
      continue;
    }
    if (totalBytes(files) + file.size > SUMMARY_MAX_TOTAL_BYTES) {
      error ??= TOTAL_TOO_BIG;
      continue;
    }
    files.push(file);
  }
  return { files, error };
}

/** The request's files, checked again on the server. */
export const summaryFilesSchema = z
  .array(z.instanceof(File))
  .min(1, { error: "ატვირთე ფაილი." })
  .max(SUMMARY_MAX_FILES, { error: TOO_MANY_FILES })
  .refine((files) => files.every((file) => file.size <= FILE_MAX_BYTES), { error: FILE_TOO_BIG })
  .refine((files) => totalBytes(files) <= SUMMARY_MAX_TOTAL_BYTES, { error: TOTAL_TOO_BIG })
  .refine((files) => files.every((file) => isSummaryFile(file.name)), {
    error: "აქ PDF, DOCX, PPTX, TXT, JPG და PNG ფაილები იტვირთება.",
  });

/**
 * Each text's share of `budget` characters: short ones keep everything, the
 * rest split what's left equally. No file is dropped, however long the others.
 */
export function shareBudget(lengths: number[], budget: number): number[] {
  const limits = lengths.map(() => 0);
  let left = budget;
  let open = lengths.map((_, index) => index);
  while (open.length > 0) {
    const share = Math.floor(left / open.length);
    const fitting = open.filter((index) => lengths[index] <= share);
    if (fitting.length === 0) {
      for (const index of open) limits[index] = share;
      break;
    }
    for (const index of fitting) {
      limits[index] = lengths[index];
      left -= lengths[index];
    }
    open = open.filter((index) => !fitting.includes(index));
  }
  return limits;
}
