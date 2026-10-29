/**
 * „სლაიდი {n}: {სათაური}“ then its text and notes: the format the models get
 * for a presentation. No zip code here, so the browser can use it for a
 * saved presentation without loading jszip.
 */
export function formatSlidesForModel(slides: { title: string; text: string; notes?: string }[]): string {
  return slides
    .map((slide, index) =>
      [`სლაიდი ${index + 1}: ${slide.title}`.trim(), slide.text, slide.notes ? `შენიშვნები: ${slide.notes}` : ""]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}
