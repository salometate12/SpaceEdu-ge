/**
 * The request for one conspectus from up to five files: each file's text
 * under `### {its name}`, cut to an equal share when the whole is too long
 * (lib/summary-files shareBudget), so no file is left out. Images, and PDFs
 * whose text can't be read (scans), go along as attachments instead.
 *
 * A file with almost no text (a PPTX of pictures) is left out and named
 * back; when nothing usable is left, the AI isn't asked at all
 * (NoMaterialTextError → 400 NO_TEXT).
 */
import type { FilePart, ImagePart, TextPart, UserModelMessage } from "ai";
import { extractFileContent } from "@/lib/ai/extract-file-text";
import { summaryPreamble } from "@/lib/ai/process-input";
import { shareBudget } from "@/lib/summary-files";
import { GenerationInputError } from "@/lib/generation-options";
import { MIN_SOURCE_TEXT, noTextHeadline } from "@/lib/conspectus-empty";

/** Nothing to make a conspectus from: the files that had no text. */
export class NoMaterialTextError extends GenerationInputError {
  constructor(public readonly files: string[]) {
    super(`${noTextHeadline(files)}. კონსპექტი არ შეიქმნა.`);
    this.name = "NoMaterialTextError";
  }
}

/** All the files' text together, at most (about what one file may send now). */
export const SUMMARY_TEXT_BUDGET = 120_000;

export const MULTI_SOURCE_HINT =
  "მასალა რამდენიმე წყაროდანაა. გააერთიანე ერთ ლოგიკურ კონსპექტად, გაიმეორებული ინფორმაცია ერთხელ დაწერე, საჭიროებისას მიუთითე წყარო.";

type Extracted = { name: string; text: string } | { name: string; part: FilePart | ImagePart };

async function extract(file: File): Promise<Extracted> {
  try {
    return { name: file.name, ...(await extractFileContent(file.name, Buffer.from(await file.arrayBuffer()))) };
  } catch (error) {
    console.error("[summary] reading a file failed", file.name, error instanceof Error ? error.message : error);
    return { name: file.name, text: "" };
  }
}

/** Joins the files' texts under their names, each cut to its share of `budget`. */
export function joinSections(sections: { name: string; text: string }[], budget: number = SUMMARY_TEXT_BUDGET): string {
  const texts = sections.map((section) => section.text.trim());
  const limits = shareBudget(
    texts.map((text) => text.length),
    budget,
  );
  return sections
    .map((section, index) => {
      const text = texts[index];
      const cut = text.length > limits[index] ? `${text.slice(0, limits[index]).trimEnd()}\n[…]` : text;
      return `### ${section.name}\n${cut || "(ტექსტი ვერ ამოვიღე)"}`;
    })
    .join("\n\n");
}

export interface MultiFileSummary {
  message: UserModelMessage;
  /** Files left out: there was no text in them. */
  skipped: string[];
}

export async function buildMultiFileSummaryMessage(files: File[], topic?: string): Promise<MultiFileSummary> {
  const extracted = await Promise.all(files.map(extract));
  const withText = extracted.filter((item): item is { name: string; text: string } => "text" in item);
  const attached = extracted.filter((item): item is { name: string; part: FilePart | ImagePart } => "part" in item);
  // A file with (almost) no text adds nothing: left out, and named back.
  const texts = withText.filter((item) => item.text.trim().length >= MIN_SOURCE_TEXT);
  const skipped = withText.filter((item) => item.text.trim().length < MIN_SOURCE_TEXT).map((item) => item.name);
  // Nothing readable left: the AI isn't asked (it would only write a letter about it).
  if (attached.length === 0 && texts.length === 0) throw new NoMaterialTextError(skipped);

  const used = texts.length + attached.length;
  const intro = [summaryPreamble(topic), used > 1 ? MULTI_SOURCE_HINT : ""].filter(Boolean).join("\n");
  const content: (TextPart | FilePart | ImagePart)[] = [
    { type: "text", text: texts.length > 0 ? `${intro}\n\n--- მასალა ---\n${joinSections(texts)}` : intro },
  ];
  for (const item of attached) {
    content.push({ type: "text", text: `### ${item.name}\n(თან ერთვის)` }, item.part);
  }
  return { message: { role: "user", content }, skipped };
}
