"use client";

import { BlockMath, MathSegment } from "@/components/math/Math";
import { parseInline } from "@/lib/markdown-blocks";

/**
 * Renders a string that may contain maths ($…$, \(…\)): the same parser and
 * KaTeX rendering as the AI answers (lib/markdown-blocks, components/math).
 * Prompts and option labels both come through here.
 */
export function MathText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {parseInline(text).map((segment, i) =>
        segment.type === "math" ? (
          <MathSegment key={i} segment={segment} />
        ) : segment.type === "bold" ? (
          <strong key={i}>{segment.text}</strong>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </span>
  );
}

/** A centered block formula. */
export function MathBlock({ latex, className }: { latex: string; className?: string }) {
  return <BlockMath latex={latex} className={className} />;
}
