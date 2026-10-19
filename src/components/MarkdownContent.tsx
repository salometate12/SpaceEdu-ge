"use client";

import type { ReactNode } from "react";
import { slugifyHeading } from "@/lib/markdown-headings";
import { parseInline, parseMarkdownBlocks } from "@/lib/markdown-blocks";
import { CodeBlock } from "@/components/CodeBlock";

function inlineFormat(text: string): ReactNode[] {
  return parseInline(text).map((segment, index) => {
    if (segment.type === "bold") {
      return (
        <strong key={index} className="font-semibold text-zinc-900 dark:text-zinc-100">
          {segment.text}
        </strong>
      );
    }
    if (segment.type === "code") {
      return (
        <code
          key={index}
          className="rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.88em] [font-variant-ligatures:none] text-pink-700 dark:border-white/10 dark:bg-white/[0.08] dark:text-pink-300"
        >
          {segment.text}
        </code>
      );
    }
    return segment.text;
  });
}

interface MarkdownContentProps {
  content: string;
  className?: string;
  /** Adds scroll-target ids to H2/H3 for table of contents */
  withAnchors?: boolean;
}

export function MarkdownContent({
  content,
  className = "",
  withAnchors = false,
}: MarkdownContentProps) {
  const usedIds = new Set<string>();
  const elements = parseMarkdownBlocks(content).map((block, key): ReactNode => {
    switch (block.type) {
      case "code":
        return <CodeBlock key={key} code={block.code} lang={block.lang} />;
      case "heading": {
        if (block.level === 1) {
          return (
            <h1 key={key} className="mb-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              {inlineFormat(block.text)}
            </h1>
          );
        }
        const id = withAnchors ? slugifyHeading(block.text, usedIds) : undefined;
        return block.level === 2 ? (
          <h2
            key={key}
            id={id}
            className="scroll-mt-4 mb-3 mt-6 border-b border-zinc-200 pb-2 text-xl font-bold text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
          >
            {inlineFormat(block.text)}
          </h2>
        ) : (
          <h3 key={key} id={id} className="scroll-mt-4 mb-2 mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {inlineFormat(block.text)}
          </h3>
        );
      }
      case "list": {
        const ListTag = block.ordered ? "ol" : "ul";
        return (
          <ListTag key={key} className={`my-3 space-y-1.5 pl-6 ${block.ordered ? "list-decimal" : "list-disc"}`}>
            {block.items.map((item, i) => (
              <li key={i} className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                {inlineFormat(item)}
              </li>
            ))}
          </ListTag>
        );
      }
      case "paragraph":
        return (
          <p key={key} className="my-3 leading-relaxed text-zinc-700 dark:text-zinc-300">
            {inlineFormat(block.text)}
          </p>
        );
    }
  });

  return (
    <article className={`conspectus-prose max-w-none ${className}`}>
      {elements}
    </article>
  );
}
