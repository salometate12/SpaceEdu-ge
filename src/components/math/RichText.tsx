"use client";

import { parseInline } from "@/lib/markdown-blocks";
import { MathSegment } from "./Math";

/**
 * One line of AI text (a card's question, a quiz option): **bold**, `code`
 * and maths ($…$) rendered, everything else as written.
 */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((segment, index) =>
        segment.type === "math" ? (
          <MathSegment key={index} segment={segment} />
        ) : segment.type === "bold" ? (
          <strong key={index}>{segment.text}</strong>
        ) : segment.type === "code" ? (
          <code key={index}>{segment.text}</code>
        ) : (
          segment.text
        ),
      )}
    </>
  );
}
