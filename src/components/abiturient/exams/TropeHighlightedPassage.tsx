"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

function escapeRegExp(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface TropeHighlightedPassageProps {
  text: string;
  /** Phrase to illuminate. Matched exactly, as authored in the data file. */
  highlight?: string;
  /**
   * `strong` is the hover/preview state used by the trope highlighter —
   * a brighter neon wash so the student's eye jumps straight to the span.
   */
  intensity?: "soft" | "strong";
  /** Poems keep every line break; prose reflows. */
  preserveLines?: boolean;
  /**
   * Use the theme-aware reading typography (`.exam-prose`) instead of the
   * dark-only default. The exam simulation opts in; the older runner keeps
   * its original look.
   */
  themed?: boolean;
}

/**
 * Renders passage text and illuminates the span tied to the active (or
 * hovered) question. This is the visual half of the Interactive Trope
 * Highlighter: the question rail drives `highlight`, this draws it.
 */
export function TropeHighlightedPassage({
  text,
  highlight,
  intensity = "soft",
  preserveLines = false,
  themed = false,
}: TropeHighlightedPassageProps) {
  const paragraphs = useMemo(() => text.split(/\n{2,}/), [text]);
  const paraClass = [
    themed ? "exam-prose" : "",
    preserveLines ? (themed ? "exam-prose-poem" : "whitespace-pre-line") : "",
  ]
    .filter(Boolean)
    .join(" ");

  const markClass = themed
    ? intensity === "strong"
      ? "rounded-md bg-cyan-500/20 px-1 py-0.5 text-cyan-900 border-b-2 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.35)] dark:bg-cyan-500/20 dark:text-cyan-100 dark:border-cyan-400 dark:shadow-[0_0_12px_rgba(6,182,212,0.4)]"
      : "rounded-md bg-cyan-400/18 px-1 py-0.5 text-cyan-900 border-b-2 border-cyan-500/60 dark:bg-cyan-500/12 dark:text-cyan-200 dark:border-cyan-400/50"
    : intensity === "strong"
      ? "rounded-md bg-cyan-500/20 px-1 py-0.5 text-cyan-100 border-b-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
      : "rounded-md bg-cyan-500/12 px-1 py-0.5 text-cyan-200 border-b-2 border-cyan-400/50";

  return (
    <div
      className={
        themed ? "space-y-5" : "space-y-5 text-[15.5px] leading-[2] text-white/90"
      }
    >
      {paragraphs.map((paragraph, index) => {
        if (!highlight || !paragraph.includes(highlight)) {
          return (
            <p key={`p-${index}`} className={paraClass}>
              {paragraph}
            </p>
          );
        }

        const parts = paragraph.split(new RegExp(`(${escapeRegExp(highlight)})`));
        return (
          <p key={`p-${index}`} className={paraClass}>
            {parts.map((part, partIndex) =>
              part === highlight ? (
                <motion.mark
                  key={`hl-${index}-${partIndex}`}
                  initial={{ opacity: 0.55 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className={markClass}
                >
                  {part}
                </motion.mark>
              ) : (
                <span key={`s-${index}-${partIndex}`}>{part}</span>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}
