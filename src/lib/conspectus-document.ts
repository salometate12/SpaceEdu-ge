/**
 * A saved conspectus as the reading page lays it out: its markdown split
 * into what's drawn (the first `#` title is left out, it's the page's own
 * heading), the „დაიმახსოვრე“ notes and the „ძირითადი დასკვნები“ section
 * as their own blocks, the contents from its `##` headings, and the meta
 * line (source, minutes to read). Pure, so it's testable apart from React.
 */
import { parseInline, parseMarkdownBlocks, type MarkdownBlock } from "./markdown-blocks";
import { slugifyHeading } from "./markdown-headings";

export type DocItem =
  | { kind: "block"; block: MarkdownBlock; id?: string }
  /** `> **დაიმახსოვრე:** …`: the blue note. */
  | { kind: "remember"; text: string }
  /** `## ძირითადი დასკვნები` and what follows it, up to the next `#`/`##`. */
  | { kind: "takeaways"; id: string; title: string; blocks: MarkdownBlock[] };

export interface ContentsEntry {
  id: string;
  text: string;
}

const REMEMBER = /^\**\s*დაიმახსოვრე\s*:?\s*\**\s*:?\s*/;
const TAKEAWAYS = /ძირითადი\s+დასკვნ/;

/** A heading's text without its markdown (for the contents and ids). */
export function headingText(text: string): string {
  return parseInline(text)
    .map((segment) => (segment.type === "math" ? segment.latex : segment.text))
    .join("")
    .trim();
}

/** The document, ready to draw: the first `#` title is the page's own, so it's left out. */
export function documentItems(content: string): DocItem[] {
  const blocks = parseMarkdownBlocks(content);
  const used = new Set<string>();
  const items: DocItem[] = [];
  let titleSkipped = false;
  let takeaways: Extract<DocItem, { kind: "takeaways" }> | null = null;

  for (const block of blocks) {
    if (block.type === "heading" && block.level === 1 && !titleSkipped && items.length === 0) {
      titleSkipped = true;
      continue;
    }
    if (block.type === "heading" && block.level <= 2) takeaways = null;

    if (block.type === "heading" && block.level === 2 && TAKEAWAYS.test(block.text)) {
      takeaways = { kind: "takeaways", id: slugifyHeading(headingText(block.text), used), title: block.text, blocks: [] };
      items.push(takeaways);
      continue;
    }
    if (takeaways) {
      takeaways.blocks.push(block);
      continue;
    }
    if (block.type === "quote" && REMEMBER.test(block.text)) {
      const text = block.text.replace(REMEMBER, "").trim();
      if (text) {
        items.push({ kind: "remember", text });
        continue;
      }
    }
    if (block.type === "heading" && block.level >= 2) {
      items.push({ kind: "block", block, id: slugifyHeading(headingText(block.text), used) });
      continue;
    }
    items.push({ kind: "block", block });
  }
  return items;
}

/** „შინაარსი“: every `##` heading (the conclusions too), in order. */
export function documentContents(items: DocItem[]): ContentsEntry[] {
  const entries: ContentsEntry[] = [];
  for (const item of items) {
    if (item.kind === "takeaways") entries.push({ id: item.id, text: headingText(item.title) });
    else if (item.kind === "block" && item.id && item.block.type === "heading" && item.block.level === 2) {
      entries.push({ id: item.id, text: headingText(item.block.text) });
    }
  }
  return entries;
}

/** „{N} წთ საკითხავი“: 200 words a minute, at least one. */
export function readingMinutes(content: string): number {
  const words = content
    .replace(/[#>*`|$\\-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** „2 ფაილი“ → „2 ფაილიდან“; a file or link name stays as it is. */
export function sourceLine(sourceLabel: string | undefined): string | null {
  const label = sourceLabel?.trim();
  if (!label) return null;
  const files = label.match(/^(\d+)\s+ფაილი$/);
  return files ? `${files[1]} ფაილიდან` : label;
}

const MONTHS = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"];

/** „8 ნოემბერი, 2026“ */
export function longDate(ms: number): string {
  const date = new Date(ms);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
}

/** A name that's safe as a file name: letters, digits, spaces. */
export function safeFileName(title: string): string {
  return title.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "კონსპექტი";
}
