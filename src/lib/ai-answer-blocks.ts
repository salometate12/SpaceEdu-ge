/**
 * How an AI-teacher answer is laid out on the page, on top of the plain
 * markdown blocks: numbered steps (an ordered list, or headings „1. …“,
 * „2. …“) become step cards, the `> **მთავარი იდეა:** …` line becomes the
 * key-idea card, and each **bold** gets the next marker colour. Pure, so
 * it's testable apart from the React rendering.
 */
import { parseMarkdownBlocks, type MarkdownBlock } from "@/lib/markdown-blocks";

export interface AnswerStep {
  /** The step's short title („სტრუქტურა შექმენი“); "" when it has none. */
  title: string;
  /** What's said under the title. */
  body: MarkdownBlock[];
}

export type AnswerBlock =
  | MarkdownBlock
  | { type: "steps"; steps: AnswerStep[] }
  | { type: "idea"; text: string };

/** The marker colours, in turn: 1st bold yellow, 2nd pink, 3rd green, 4th yellow… */
export const MARK_COLORS = ["yellow", "pink", "green"] as const;
export type MarkColor = (typeof MARK_COLORS)[number];

export function markColor(index: number): MarkColor {
  return MARK_COLORS[index % MARK_COLORS.length];
}

const IDEA = /^(?:\*\*)?მთავარი იდეა(?:\*\*)?\s*[:：]\s*(?:\*\*)?\s*([\s\S]*)$/;

/** The text of a „მთავარი იდეა:“ quote, or null for any other quote. */
export function keyIdeaText(quote: string): string | null {
  const match = quote.trim().match(IDEA);
  return match ? match[1].trim() : null;
}

const NUMBERED_HEADING = /^\d+[.)]\s+(.+)$/;

/**
 * A list item „**სათაური** — ტექსტი“ (or „**სათაური:** ტექსტი“) as a step
 * with a title; anything else is a step with only text.
 */
export function splitStepItem(item: string): AnswerStep {
  const match = item.match(/^\*\*([^*]+?)[:：]?\*\*\s*(?:[:：—–-]\s*)?([\s\S]*)$/);
  if (!match) return { title: "", body: [{ type: "paragraph", text: item }] };
  const rest = match[2].trim();
  return { title: match[1].trim(), body: rest ? [{ type: "paragraph", text: rest }] : [] };
}

export function toAnswerBlocks(blocks: MarkdownBlock[]): AnswerBlock[] {
  const out: AnswerBlock[] = [];
  let steps: AnswerStep[] | null = null;
  const flush = () => {
    if (steps && steps.length > 0) out.push({ type: "steps", steps });
    steps = null;
  };

  for (const block of blocks) {
    if (block.type === "quote") {
      const idea = keyIdeaText(block.text);
      if (idea !== null) {
        flush();
        out.push({ type: "idea", text: idea });
        continue;
      }
    }
    if (block.type === "list" && block.ordered) {
      flush();
      out.push({ type: "steps", steps: block.items.map(splitStepItem) });
      continue;
    }
    if (block.type === "heading" && block.level > 1) {
      const numbered = block.text.match(NUMBERED_HEADING);
      if (numbered) {
        steps ??= [];
        steps.push({ title: numbered[1].trim(), body: [] });
        continue;
      }
      flush();
      out.push(block);
      continue;
    }
    // Under a numbered heading: that step's text.
    const current: AnswerStep[] | null = steps;
    if (current && current.length > 0) {
      current[current.length - 1].body.push(block);
      continue;
    }
    out.push(block);
  }
  flush();
  return out;
}

export function parseAnswer(content: string): AnswerBlock[] {
  return toAnswerBlocks(parseMarkdownBlocks(content));
}
