"use client";

import type { ReactNode } from "react";
import { slugifyHeading } from "@/lib/markdown-headings";

function inlineFormat(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const bold = match[1].slice(2, -2);
    parts.push(
      <strong key={key++} className="font-semibold text-zinc-900 dark:text-zinc-100">
        {bold}
      </strong>,
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : [text];
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
  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let listItems: string[] = [];
  let listOrdered = false;
  let key = 0;
  const usedIds = new Set<string>();

  const flushList = () => {
    if (listItems.length === 0) return;
    const ListTag = listOrdered ? "ol" : "ul";
    elements.push(
      <ListTag
        key={key++}
        className={`my-3 space-y-1.5 pl-6 ${listOrdered ? "list-decimal" : "list-disc"}`}
      >
        {listItems.map((item, i) => (
          <li key={i} className="leading-relaxed text-zinc-700 dark:text-zinc-300">
            {inlineFormat(item)}
          </li>
        ))}
      </ListTag>,
    );
    listItems = [];
    listOrdered = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      const text = trimmed.slice(4);
      const id = withAnchors ? slugifyHeading(text, usedIds) : undefined;
      elements.push(
        <h3
          key={key++}
          id={id}
          className="scroll-mt-4 mb-2 mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          {inlineFormat(text)}
        </h3>,
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      const text = trimmed.slice(3);
      const id = withAnchors ? slugifyHeading(text, usedIds) : undefined;
      elements.push(
        <h2
          key={key++}
          id={id}
          className="scroll-mt-4 mb-3 mt-6 border-b border-zinc-200 pb-2 text-xl font-bold text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
        >
          {inlineFormat(text)}
        </h2>,
      );
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h1
          key={key++}
          className="mb-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl"
        >
          {inlineFormat(trimmed.slice(2))}
        </h1>,
      );
      continue;
    }

    const unordered = trimmed.match(/^[-*]\s+(.+)/);
    if (unordered) {
      if (listOrdered) flushList();
      listOrdered = false;
      listItems.push(unordered[1]);
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)/);
    if (ordered) {
      if (!listOrdered && listItems.length) flushList();
      listOrdered = true;
      listItems.push(ordered[1]);
      continue;
    }

    flushList();
    elements.push(
      <p
        key={key++}
        className="my-3 leading-relaxed text-zinc-700 dark:text-zinc-300"
      >
        {inlineFormat(trimmed)}
      </p>,
    );
  }

  flushList();

  return (
    <article className={`conspectus-prose max-w-none ${className}`}>
      {elements}
    </article>
  );
}
