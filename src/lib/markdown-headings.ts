export interface MarkdownHeading {
  id: string;
  level: 2 | 3;
  text: string;
}

function stripMarkdownInline(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
}

export function slugifyHeading(text: string, used: Set<string>): string {
  const base =
    stripMarkdownInline(text)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 48) || "section";

  let id = base;
  let n = 1;
  while (used.has(id)) {
    id = `${base}-${n++}`;
  }
  used.add(id);
  return id;
}

export function extractMarkdownHeadings(content: string): MarkdownHeading[] {
  const used = new Set<string>();
  const headings: MarkdownHeading[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ") && !trimmed.startsWith("### ")) {
      const text = stripMarkdownInline(trimmed.slice(3));
      headings.push({
        id: slugifyHeading(text, used),
        level: 2,
        text,
      });
    } else if (trimmed.startsWith("### ")) {
      const text = stripMarkdownInline(trimmed.slice(4));
      headings.push({
        id: slugifyHeading(text, used),
        level: 3,
        text,
      });
    }
  }

  return headings;
}
