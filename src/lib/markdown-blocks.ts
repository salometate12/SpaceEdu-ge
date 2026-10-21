/**
 * The small markdown dialect MarkdownContent renders: headings, lists,
 * paragraphs, > quotes, **bold**, `inline code` and fenced code blocks. Pure, so the
 * parsing is testable apart from the React rendering.
 */

export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "paragraph"; text: string }
  /** Consecutive `> ` lines, joined into one block. */
  | { type: "quote"; text: string }
  | {
      type: "code";
      /** Lower-case language tag, or "" when none was given. */
      lang: string;
      code: string;
      /** False while a streamed block hasn't received its closing fence. */
      closed: boolean;
    };

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)[^`]*$/;

export function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] | null = null;

  const flushList = () => {
    if (list && list.items.length > 0) blocks.push({ type: "list", ...list });
    list = null;
  };
  const flushQuote = () => {
    if (quote && quote.length > 0) blocks.push({ type: "quote", text: quote.join(" ") });
    quote = null;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = line.match(FENCE_OPEN);
    if (fence) {
      flushList();
      flushQuote();
      const marker = fence[1];
      const closing = new RegExp(`^ {0,3}${marker[0] === "`" ? "`" : "~"}{${marker.length},}\\s*$`);
      const body: string[] = [];
      let closed = false;
      for (index += 1; index < lines.length; index += 1) {
        if (closing.test(lines[index])) {
          closed = true;
          break;
        }
        // Inside a fence nothing is markdown: lines and spacing stay as is.
        body.push(lines[index]);
      }
      blocks.push({ type: "code", lang: fence[2].toLowerCase(), code: body.join("\n"), closed });
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      flushQuote();
      continue;
    }

    const quoted = trimmed.match(/^>\s?(.*)$/);
    if (quoted) {
      flushList();
      quote ??= [];
      if (quoted[1].trim()) quote.push(quoted[1].trim());
      continue;
    }
    flushQuote();

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushList();
      blocks.push({ type: "heading", level: heading[1].length as 1 | 2 | 3, text: heading[2] });
      continue;
    }

    const unordered = trimmed.match(/^[-*]\s+(.+)/);
    const ordered = unordered ? null : trimmed.match(/^\d+\.\s+(.+)/);
    if (unordered || ordered) {
      const isOrdered = Boolean(ordered);
      if (list && list.ordered !== isOrdered) flushList();
      if (!list) list = { ordered: isOrdered, items: [] };
      list.items.push((unordered ?? ordered)![1]);
      continue;
    }

    flushList();
    blocks.push({ type: "paragraph", text: trimmed });
  }

  flushList();
  flushQuote();
  return blocks;
}

export type InlineSegment =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "code"; text: string };

/** **bold** and `code` inside a line; inside backticks nothing else applies. */
export function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const pattern = /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) segments.push({ type: "text", text: text.slice(last, match.index) });
    if (match[2] !== undefined) segments.push({ type: "code", text: match[2] });
    else segments.push({ type: "bold", text: match[3] });
    last = pattern.lastIndex;
  }
  if (last < text.length) segments.push({ type: "text", text: text.slice(last) });
  return segments.length > 0 ? segments : [{ type: "text", text }];
}

/**
 * The answer as plain text for „ტექსტად კოპირება“: no #, **, backticks or
 * fences; code keeps its lines, list items keep a bullet or number.
 */
export function markdownToPlainText(content: string): string {
  return parseMarkdownBlocks(content)
    .map((block) => {
      const inline = (text: string) => parseInline(text).map((s) => s.text).join("");
      switch (block.type) {
        case "code":
          return block.code;
        case "heading":
        case "paragraph":
        case "quote":
          return inline(block.text);
        case "list":
          return block.items.map((item, i) => `${block.ordered ? `${i + 1}.` : "•"} ${inline(item)}`).join("\n");
      }
    })
    .join("\n\n");
}
