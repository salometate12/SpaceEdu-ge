"use client";

import type { ReactNode } from "react";
import { CodeBlock } from "@/components/CodeBlock";
import { markColor, parseAnswer, type AnswerBlock } from "@/lib/ai-answer-blocks";
import { parseInline, type MarkdownBlock } from "@/lib/markdown-blocks";

/**
 * An AI-teacher answer in the notebook style: marker-underlined bold in
 * turning colours, numbered step cards and the „მთავარი იდეა“ card. Its
 * look lives in src/app/ai-teacher/chat-theme.css (`.ai-chat .ai-answer`).
 */
export function AnswerContent({ content }: { content: string }) {
  // Bold counts across the whole answer, so the colours keep turning.
  let marks = 0;

  const inline = (text: string): ReactNode[] =>
    parseInline(text).map((segment, index) => {
      if (segment.type === "bold") {
        return (
          <strong key={index} data-mark={markColor(marks++)}>
            {segment.text}
          </strong>
        );
      }
      if (segment.type === "code") return <code key={index}>{segment.text}</code>;
      return segment.text;
    });

  const block = (item: MarkdownBlock | AnswerBlock, key: number): ReactNode => {
    switch (item.type) {
      case "code":
        return <CodeBlock key={key} code={item.code} lang={item.lang} />;
      case "heading": {
        const Heading = item.level === 1 ? "h2" : item.level === 2 ? "h3" : "h4";
        return <Heading key={key}>{inline(item.text)}</Heading>;
      }
      case "list": {
        const List = item.ordered ? "ol" : "ul";
        return (
          <List key={key}>
            {item.items.map((entry, index) => (
              <li key={index}>{inline(entry)}</li>
            ))}
          </List>
        );
      }
      case "quote":
        return <blockquote key={key}>{inline(item.text)}</blockquote>;
      case "paragraph":
        return <p key={key}>{inline(item.text)}</p>;
      case "steps":
        return (
          <ol key={key} className="ai-steps">
            {item.steps.map((step, index) => (
              <li key={index} data-step={index % 3}>
                <span className="ai-step-number" aria-hidden>
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  {step.title ? <p className="ai-step-title">{inline(step.title)}</p> : null}
                  {step.body.map(block)}
                </div>
              </li>
            ))}
          </ol>
        );
      case "idea":
        return (
          <aside key={key} className="ai-idea" data-idea>
            <p className="ai-idea-label">მთავარი იდეა</p>
            <p className="ai-idea-text">{inline(item.text)}</p>
          </aside>
        );
    }
  };

  return <article>{parseAnswer(content).map(block)}</article>;
}
