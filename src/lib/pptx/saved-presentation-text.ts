import type { GeneratedSlide } from "@/lib/presentation-types";
import { formatSlidesForModel } from "./format";

/** A saved presentation's slides as study text, in the same format as an uploaded .pptx. */
export function savedPresentationText(slides: GeneratedSlide[]): string {
  return formatSlidesForModel(
    slides.map((slide) => ({
      title: slide.title ?? "",
      text: [
        slide.body,
        ...(slide.points ?? []).map((point) => `• ${point}`),
        ...(slide.columns ?? []).map((column) => `${column.heading}: ${column.text}`),
        slide.quote ? `„${slide.quote.text}“${slide.quote.author ? `, ${slide.quote.author}` : ""}` : "",
        slide.figure ? `${slide.figure.value}: ${slide.figure.caption}` : "",
      ]
        .filter((line) => line && line.trim())
        .join("\n"),
      notes: "",
    })),
  );
}
