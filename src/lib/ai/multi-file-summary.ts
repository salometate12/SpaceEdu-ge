/**
 * The request for one conspectus from up to five files: each file's text
 * under `### {its name}`, cut to an equal share when the whole is too long
 * (lib/summary-files shareBudget), so no file is left out. Images, and PDFs
 * whose text can't be read (scans), go along as attachments instead.
 */
import type { FilePart, ImagePart, TextPart, UserModelMessage } from "ai";
import { extractFileContent } from "@/lib/ai/extract-file-text";
import { summaryPreamble } from "@/lib/ai/process-input";
import { shareBudget } from "@/lib/summary-files";

/** All the files' text together, at most (about what one file may send now). */
export const SUMMARY_TEXT_BUDGET = 120_000;

export const MULTI_SOURCE_HINT =
  "მასალა რამდენიმე წყაროდანაა. გააერთიანე ერთ ლოგიკურ კონსპექტად, გაიმეორებული ინფორმაცია ერთხელ დაწერე, საჭიროებისას მიუთითე წყარო.";

type Extracted = { name: string; text: string } | { name: string; part: FilePart | ImagePart };

async function extract(file: File): Promise<Extracted> {
  return { name: file.name, ...(await extractFileContent(file.name, Buffer.from(await file.arrayBuffer()))) };
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

export async function buildMultiFileSummaryMessage(files: File[], topic?: string): Promise<UserModelMessage> {
  const extracted = await Promise.all(files.map(extract));
  const texts = extracted.filter((item): item is { name: string; text: string } => "text" in item);
  const attached = extracted.filter((item): item is { name: string; part: FilePart | ImagePart } => "part" in item);

  const intro = [summaryPreamble(topic), files.length > 1 ? MULTI_SOURCE_HINT : ""].filter(Boolean).join("\n");
  const content: (TextPart | FilePart | ImagePart)[] = [
    { type: "text", text: texts.length > 0 ? `${intro}\n\n--- მასალა ---\n${joinSections(texts)}` : intro },
  ];
  for (const item of attached) {
    content.push({ type: "text", text: `### ${item.name}\n(თან ერთვის)` }, item.part);
  }
  return { role: "user", content };
}
