import type { AboutAccent, AboutSegment } from "@/lib/about-content";

/**
 * Renders a paragraph made of plain and highlighted segments. The accent
 * colours are the notebook page's own — pen colours on paper — and each has
 * a night-mode pair so the language and theme switches both keep working.
 */

const ACCENT_TEXT: Record<AboutAccent, string> = {
  blue: "text-sky-600 dark:text-sky-300",
  green: "text-emerald-600 dark:text-emerald-300",
  pink: "text-pink-600 dark:text-pink-300",
  amber: "text-amber-600 dark:text-amber-300",
};

const ACCENT_UNDERLINE: Record<AboutAccent, string> = {
  blue: "decoration-sky-400/50 dark:decoration-sky-400/40",
  green: "decoration-emerald-400/50 dark:decoration-emerald-400/40",
  pink: "decoration-pink-400/50 dark:decoration-pink-400/40",
  amber: "decoration-amber-400/60 dark:decoration-amber-400/40",
};

interface SegmentsProps {
  value: AboutSegment[];
  /** Body copy underlines its keywords; headings just colour them. */
  underline?: boolean;
}

export function Segments({ value, underline = false }: SegmentsProps) {
  return (
    <>
      {value.map((segment, index) => {
        if (!segment.accent) {
          return <span key={index}>{segment.text}</span>;
        }
        return (
          <span
            key={index}
            className={`font-semibold ${ACCENT_TEXT[segment.accent]} ${
              underline
                ? `underline decoration-[3px] underline-offset-[6px] ${ACCENT_UNDERLINE[segment.accent]}`
                : ""
            }`}
          >
            {segment.text}
          </span>
        );
      })}
    </>
  );
}

/** Border / background pair used by the audience cards. */
export const ACCENT_CARD: Record<AboutAccent, string> = {
  blue: "border-sky-300/70 bg-sky-100/50 dark:border-sky-400/25 dark:bg-sky-400/[0.07]",
  green:
    "border-emerald-300/70 bg-emerald-100/50 dark:border-emerald-400/25 dark:bg-emerald-400/[0.07]",
  pink: "border-pink-300/70 bg-pink-100/50 dark:border-pink-400/25 dark:bg-pink-400/[0.07]",
  amber: "border-amber-300/70 bg-amber-100/50 dark:border-amber-400/25 dark:bg-amber-400/[0.07]",
};

export const ACCENT_LABEL: Record<AboutAccent, string> = ACCENT_TEXT;
