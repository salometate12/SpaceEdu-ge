/**
 * The small markdown dialect MarkdownContent renders: headings, lists,
 * paragraphs, > quotes, **bold**, `inline code`, fenced code blocks and
 * LaTeX maths ($…$, \(…\) in a line; $$…$$, \[…\] as a block). Pure, so the
 * parsing is testable apart from the React rendering.
 */

export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "paragraph"; text: string }
  /** Consecutive `> ` lines, joined into one block. */
  | { type: "quote"; text: string }
  /**
   * $$…$$ or \[…\] on lines of their own. Not closed yet (a streamed answer):
   * shown as the plain text it is until the closing delimiter arrives.
   */
  | { type: "math"; latex: string; closed: boolean; source: string }
  | {
      type: "code";
      /** Lower-case language tag, or "" when none was given. */
      lang: string;
      code: string;
      /** False while a streamed block hasn't received its closing fence. */
      closed: boolean;
    };

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)[^`]*$/;

/** A display formula's opening on its line: $$ or \[ (the rest of the line may hold all of it). */
const MATH_OPEN = /^(\$\$|\\\[)/;
const MATH_CLOSE: Record<string, string> = { $$: "$$", "\\[": "\\]" };

/**
 * A display formula starting at `lines[start]`: its LaTeX, how many lines it
 * took, whether it was closed and anything after the closing delimiter on
 * that line. Null when the line doesn't start one.
 */
function readMathBlock(lines: string[], start: number): { latex: string; end: number; closed: boolean; after: string; source: string } | null {
  const first = lines[start].trim();
  const open = first.match(MATH_OPEN)?.[1];
  if (!open) return null;
  const close = MATH_CLOSE[open];
  const parts: string[] = [];
  let rest = first.slice(open.length);
  for (let index = start; index < lines.length; index += 1) {
    if (index > start) rest = lines[index];
    const at = rest.indexOf(close);
    if (at !== -1) {
      parts.push(rest.slice(0, at));
      const latex = parts.join("\n").trim();
      // „$$ $$“ or an empty \[\]: not a formula.
      if (!latex) return null;
      return { latex, end: index, closed: true, after: rest.slice(at + close.length).trim(), source: lines.slice(start, index + 1).join("\n") };
    }
    parts.push(rest);
  }
  return { latex: parts.join("\n").trim(), end: lines.length - 1, closed: false, after: "", source: lines.slice(start).join("\n") };
}

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

    const math = readMathBlock(lines, index);
    if (math) {
      flushList();
      flushQuote();
      blocks.push({ type: "math", latex: math.latex, closed: math.closed, source: math.source });
      if (math.after) blocks.push({ type: "paragraph", text: math.after });
      index = math.end;
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
  | { type: "code"; text: string }
  /** LaTeX: $…$ or \(…\); `display` for a $$…$$ / \[…\] inside a line. */
  | { type: "math"; latex: string; display: boolean };

/**
 * `code`, maths and **bold** inside a line, whichever starts first; inside
 * backticks nothing else applies. A $ is maths only as $x$: not after a
 * digit or a backslash, no space just inside either $, and not followed by
 * a digit, so „5$ და 10$“ stays a price.
 */
const INLINE =
  /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)|(?<![\\$])\$\$(?=\S)([^$]*?\S)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|(?<![\\$\d])\$(?=[^\s$])([^$\n]*?[^\s$\\])\$(?![$\d])|\*\*([^*]+)\*\*/g;

export function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const pattern = new RegExp(INLINE.source, "g");
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) segments.push({ type: "text", text: text.slice(last, match.index) });
    if (match[2] !== undefined) segments.push({ type: "code", text: match[2] });
    else if (match[3] !== undefined) segments.push({ type: "math", latex: match[3].trim(), display: true });
    else if (match[4] !== undefined) segments.push({ type: "math", latex: match[4].trim(), display: true });
    else if (match[5] !== undefined) segments.push({ type: "math", latex: match[5].trim(), display: false });
    else if (match[6] !== undefined) segments.push({ type: "math", latex: match[6], display: false });
    else segments.push({ type: "bold", text: match[7] });
    last = pattern.lastIndex;
  }
  if (last < text.length) segments.push({ type: "text", text: text.slice(last) });
  return segments.length > 0 ? segments : [{ type: "text", text }];
}

/** A segment as plain text: maths as its LaTeX (what KaTeX's annotation holds). */
const segmentText = (segment: InlineSegment) => (segment.type === "math" ? segment.latex : segment.text);

/**
 * The answer as plain text for „ტექსტად კოპირება“: no #, **, backticks,
 * fences or $; code keeps its lines, list items keep a bullet or number,
 * a formula is its LaTeX source.
 */
export function markdownToPlainText(content: string): string {
  return parseMarkdownBlocks(content)
    .map((block) => {
      const inline = (text: string) => parseInline(text).map(segmentText).join("");
      switch (block.type) {
        case "code":
          return block.code;
        case "math":
          return block.closed ? block.latex : block.source;
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
