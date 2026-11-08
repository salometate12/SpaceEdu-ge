"use client";

import type { ReactNode } from "react";
import { Flag, Lightbulb } from "lucide-react";
import { parseInline, type MarkdownBlock } from "@/lib/markdown-blocks";
import type { DocItem } from "@/lib/conspectus-document";
import { CodeBlock } from "@/components/CodeBlock";
import { BlockMath, MathSegment } from "@/components/math/Math";
import { MarkdownTable } from "@/components/MarkdownContent";

/** **bold** (the highlighter marks it in CSS), `code` and $maths$ in a line. */
function inline(text: string): ReactNode[] {
  return parseInline(text).map((segment, index) => {
    if (segment.type === "bold") return <strong key={index}>{segment.text}</strong>;
    if (segment.type === "math") return <MathSegment key={index} segment={segment} />;
    if (segment.type === "code") {
      return (
        <code key={index} className="rounded-md border border-[var(--cs-border)] bg-[var(--cs-soft)] px-1.5 py-0.5 font-mono text-[0.88em] text-pink-700 dark:text-pink-300">
          {segment.text}
        </code>
      );
    }
    return segment.text;
  });
}

function Block({ block, id }: { block: MarkdownBlock; id?: string }) {
  switch (block.type) {
    case "heading":
      if (block.level === 1) return <h1>{inline(block.text)}</h1>;
      return block.level === 2 ? <h2 id={id}>{inline(block.text)}</h2> : <h3 id={id}>{inline(block.text)}</h3>;
    case "paragraph":
      return <p>{inline(block.text)}</p>;
    case "quote":
      return <blockquote>{inline(block.text)}</blockquote>;
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List>
          {block.items.map((item, index) => (
            <li key={index}>{inline(item)}</li>
          ))}
        </List>
      );
    }
    case "math":
      return block.closed ? <BlockMath latex={block.latex} /> : <p>{block.source}</p>;
    case "code":
      return <CodeBlock code={block.code} lang={block.lang} />;
    case "table":
      return <MarkdownTable header={block.header} rows={block.rows} format={inline} />;
  }
}

/** The conspectus's text, without its `#` title (the page shows it above). */
export function ConspectusDocument({ items }: { items: DocItem[] }) {
  return (
    <div className="cs-doc">
      {items.map((item, index) => {
        if (item.kind === "remember") {
          return (
            <aside key={index} className="cs-remember" aria-label="დაიმახსოვრე">
              <Lightbulb className="mt-1 h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              <p className="!m-0">
                <strong>დაიმახსოვრე: </strong>
                {inline(item.text)}
              </p>
            </aside>
          );
        }
        if (item.kind === "takeaways") {
          return (
            <section key={index} className="cs-takeaways" aria-labelledby={item.id}>
              <h2 id={item.id}>
                <Flag className="h-5 w-5 shrink-0" strokeWidth={2.2} aria-hidden />
                <span>{inline(item.title)}</span>
              </h2>
              {item.blocks.map((block, inner) => (
                <Block key={inner} block={block} />
              ))}
            </section>
          );
        }
        return <Block key={index} block={item.block} id={item.id} />;
      })}
    </div>
  );
}
