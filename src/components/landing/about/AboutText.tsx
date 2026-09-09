import type { AboutSegment } from "@/lib/about-content";
import { ACCENT_TEXT, ACCENT_UNDERLINE } from "../notebook/accents";

/**
 * Renders a paragraph made of plain and highlighted segments. The accent
 * colours are the notebook page's own — pen colours on paper — and each has
 * a night-mode pair so the language and theme switches both keep working.
 */

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
