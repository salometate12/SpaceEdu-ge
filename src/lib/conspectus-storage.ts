import { CONSPECTUS_STORAGE_KEY as STORAGE_KEY, CONSPECTUS_UPDATED_EVENT } from "./user-data-keys";
import { userStore } from "./user-data";

export { CONSPECTUS_UPDATED_EVENT };

export interface Conspectus {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  sourceLabel?: string;
}

export function getConspectusList(): Conspectus[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Conspectus[];
  } catch {
    return [];
  }
}

export function saveConspectus(conspectus: Conspectus): void {
  const existing = getConspectusList();
  const filtered = existing.filter((c) => c.id !== conspectus.id);
  userStore.set(STORAGE_KEY, [conspectus, ...filtered].slice(0, 20));
}

export function getConspectusById(id: string): Conspectus | undefined {
  return getConspectusList().find((c) => c.id === id);
}

export function extractTitleFromMarkdown(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match?.[1]) return match[1].trim();
  const firstLine = content.split("\n").find((l) => l.trim());
  return firstLine?.slice(0, 80).replace(/^#+\s*/, "") || "კონსპექტი";
}

export function createConspectusId(): string {
  return `conspectus-${Date.now()}`;
}
