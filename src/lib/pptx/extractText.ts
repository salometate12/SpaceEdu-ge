import JSZip from "jszip";
import { formatSlidesForModel } from "./format";

export { formatSlidesForModel };

export interface PptxSlideText {
  /** 1-based, in the deck's order. */
  number: number;
  title: string;
  text: string;
  notes: string;
}

const SLIDE_PATH = /^ppt\/slides\/slide(\d+)\.xml$/;
const NOTES_PATH = /^ppt\/notesSlides\/notesSlide(\d+)\.xml$/;

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&");
}

/** The text runs of one slide part, a paragraph per line. */
export function paragraphsFromXml(xml: string): string[] {
  const paragraphs: string[] = [];
  for (const paragraph of xml.split(/<\/a:p>/)) {
    const runs = [...paragraph.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)].map((match) => decodeXml(match[1]));
    const line = runs.join("").replace(/\s+/g, " ").trim();
    if (line) paragraphs.push(line);
  }
  return paragraphs;
}

/** Notes slides repeat the slide number in a field; drop lines that are only a number. */
function notesText(xml: string): string {
  return paragraphsFromXml(xml)
    .filter((line) => !/^\d+$/.test(line))
    .join("\n");
}

/**
 * The text of a .pptx, slide by slide in order, with the speaker notes. The
 * first paragraph of a slide is taken as its title. Used wherever a
 * presentation becomes study material (flashcards, quizzes).
 */
export async function extractPptxSlides(data: ArrayBuffer | Uint8Array): Promise<PptxSlideText[]> {
  const zip = await JSZip.loadAsync(data);
  const slides = new Map<number, PptxSlideText>();
  const notes = new Map<number, string>();
  await Promise.all(
    Object.keys(zip.files).map(async (path) => {
      const slide = path.match(SLIDE_PATH);
      const note = path.match(NOTES_PATH);
      if (!slide && !note) return;
      const xml = await zip.files[path].async("string");
      if (slide) {
        const [title = "", ...rest] = paragraphsFromXml(xml);
        slides.set(Number(slide[1]), { number: Number(slide[1]), title, text: rest.join("\n"), notes: "" });
      } else if (note) {
        notes.set(Number(note[1]), notesText(xml));
      }
    }),
  );
  return [...slides.values()]
    .sort((a, b) => a.number - b.number)
    .map((slide, index) => ({ ...slide, number: index + 1, notes: notes.get(slide.number) ?? "" }));
}

export async function extractPptxText(data: ArrayBuffer | Uint8Array): Promise<string> {
  const slides = await extractPptxSlides(data);
  const hasText = slides.some((slide) => slide.title || slide.text || slide.notes);
  return hasText ? formatSlidesForModel(slides) : "";
}
