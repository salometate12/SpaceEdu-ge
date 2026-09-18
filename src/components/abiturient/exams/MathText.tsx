"use client";

import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

/**
 * Renders a string that may contain inline maths written between `$…$`. The
 * text between dollar signs is KaTeX; everything else is plain Georgian text.
 * Prompts and option labels both come through here.
 */
export function MathText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          const latex = part.slice(1, -1);
          try {
            return <InlineMath key={i} math={latex} />;
          } catch {
            return <span key={i}>{part}</span>;
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

/** A centered block formula. */
export function MathBlock({ latex, className }: { latex: string; className?: string }) {
  try {
    return (
      <div className={className}>
        <BlockMath math={latex} />
      </div>
    );
  } catch {
    return <div className={className}>{latex}</div>;
  }
}
