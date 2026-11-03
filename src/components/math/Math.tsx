"use client";

import "katex/dist/katex.min.css";
import "./math.css";
import katex from "katex";
import { useMemo, type ReactNode } from "react";
import type { InlineSegment } from "@/lib/markdown-blocks";

/**
 * A formula as KaTeX HTML (with MathML, so its LaTeX stays in the
 * annotation). Wrong LaTeX never throws: KaTeX shows the source, which
 * math.css turns light grey.
 */
function renderLatex(latex: string, displayMode: boolean): string {
  return katex.renderToString(latex, {
    displayMode,
    throwOnError: false,
    output: "htmlAndMathml",
    strict: "ignore",
    trust: false,
  });
}

/** $…$ in a line. */
export function InlineMath({ latex }: { latex: string }) {
  const html = useMemo(() => renderLatex(latex, false), [latex]);
  return <span className="ai-math-inline" data-latex={latex} dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * $$…$$ as its own centred block; a wide one scrolls sideways instead of
 * widening the page. Inside a paragraph (`inParagraph`) it's a block-level
 * span, since a <div> can't sit in a <p>.
 */
export function BlockMath({ latex, className = "", inParagraph = false }: { latex: string; className?: string; inParagraph?: boolean }) {
  const html = useMemo(() => renderLatex(latex, true), [latex]);
  const Tag = inParagraph ? "span" : "div";
  return <Tag className={`ai-math-block ${className}`} data-latex={latex} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** A line's maths segment: inline, or a display formula written inside the line. */
export function MathSegment({ segment }: { segment: Extract<InlineSegment, { type: "math" }> }): ReactNode {
  return segment.display ? <BlockMath latex={segment.latex} inParagraph /> : <InlineMath latex={segment.latex} />;
}
