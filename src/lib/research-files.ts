/**
 * The research page's files and memory, as pure helpers plus small storage
 * wrappers: what kind a file is, the size limit, a PDF's page count, and
 * the last analyses (reopened without calling the AI).
 */
import type { ResearchResponse, ResearchSectionKey } from "@/lib/ai/research-platform-schema";

export const RESEARCH_MAX_BYTES = 15 * 1024 * 1024;
export const RESEARCH_HISTORY_KEY = "spaceedu:research:history";
export const RESEARCH_HISTORY_LIMIT = 20;

export type ResearchFileKind = "pdf" | "audio" | "image" | "text";

const TEXT_EXTENSIONS = [".txt", ".md"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".heic", ".heif"];
const AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".webm", ".flac"];

/** The kind of a file, or null when it isn't supported. */
export function researchFileKind(file: { name: string; type: string }): ResearchFileKind | null {
  const lower = file.name.toLowerCase();
  if (file.type === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image/") || IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return "image";
  if (file.type.startsWith("audio/") || AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext))) return "audio";
  if (file.type.startsWith("text/") || TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext))) return "text";
  return null;
}

/** „4.2 MB“, „820 KB“ */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function isTooLarge(bytes: number): boolean {
  return bytes > RESEARCH_MAX_BYTES;
}

/** A PDF's page count from its raw text (each page object is „/Type /Page“); null if none found. */
export function countPdfPages(raw: string): number | null {
  const pages = raw.match(/\/Type\s*\/Page(?![a-zA-Z])/g)?.length ?? 0;
  return pages > 0 ? pages : null;
}

/** About how long the analysis takes to read, at ~180 words a minute. */
export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export interface ResearchHistoryItem {
  id: string;
  name: string;
  kind: ResearchFileKind;
  sections: ResearchSectionKey[];
  result: ResearchResponse;
  at: number;
}

/** Newest first; the same file replaces its older analysis; at most 20. */
export function addResearchHistory(history: ResearchHistoryItem[], item: ResearchHistoryItem): ResearchHistoryItem[] {
  return [item, ...history.filter((entry) => entry.id !== item.id && entry.name !== item.name)].slice(0, RESEARCH_HISTORY_LIMIT);
}

function isHistoryItem(value: unknown): value is ResearchHistoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ResearchHistoryItem>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.at === "number" &&
    Array.isArray(item.sections) &&
    !!item.result &&
    typeof item.result.title === "string" &&
    typeof item.result.summary === "string"
  );
}

export function parseResearchHistory(raw: string | null): ResearchHistoryItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isHistoryItem).slice(0, RESEARCH_HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

export function readResearchHistory(): ResearchHistoryItem[] {
  try {
    return parseResearchHistory(window.localStorage.getItem(RESEARCH_HISTORY_KEY));
  } catch {
    return [];
  }
}

export function writeResearchHistory(history: ResearchHistoryItem[]): void {
  try {
    window.localStorage.setItem(RESEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // kept for this visit only
  }
}

/** A history entry for an analysis just made, stamped now. */
export function researchHistoryItem(
  fields: Omit<ResearchHistoryItem, "id" | "at">,
): ResearchHistoryItem {
  return { ...fields, id: `${fields.name}:${Date.now()}`, at: Date.now() };
}
