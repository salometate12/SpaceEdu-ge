import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { extractPptxSlides, extractPptxText, formatSlidesForModel, paragraphsFromXml } from "./extractText";

const slideXml = (...paragraphs: string[]) =>
  `<p:sld><p:txBody>${paragraphs.map((p) => `<a:p><a:r><a:t>${p}</a:t></a:r></a:p>`).join("")}</p:txBody></p:sld>`;

async function pptx(files: Record<string, string>): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) zip.file(path, content);
  return zip.generateAsync({ type: "uint8array" });
}

describe("paragraphsFromXml", () => {
  it("joins the runs of a paragraph and decodes entities", () => {
    const xml = `<a:p><a:r><a:t>უჯრედის </a:t></a:r><a:r><a:t xml:space="preserve">აღნაგობა &amp; ფუნქცია</a:t></a:r></a:p><a:p></a:p>`;
    expect(paragraphsFromXml(xml)).toEqual(["უჯრედის აღნაგობა & ფუნქცია"]);
  });
});

describe("extractPptxSlides", () => {
  it("reads slides in number order (10 after 2) with their notes", async () => {
    const data = await pptx({
      "ppt/slides/slide10.xml": slideXml("ბოლო", "დასკვნა"),
      "ppt/slides/slide2.xml": slideXml("მეორე", "ტექსტი"),
      "ppt/slides/slide1.xml": slideXml("სათაური"),
      "ppt/notesSlides/notesSlide2.xml": slideXml("მოყევი მაგალითი", "2"),
    });
    const slides = await extractPptxSlides(data);
    expect(slides.map((s) => s.title)).toEqual(["სათაური", "მეორე", "ბოლო"]);
    expect(slides[1]).toMatchObject({ number: 2, text: "ტექსტი", notes: "მოყევი მაგალითი" });
  });

  it("returns empty text for a deck with no words", async () => {
    expect(await extractPptxText(await pptx({ "ppt/slides/slide1.xml": "<p:sld/>" }))).toBe("");
  });
});

describe("formatSlidesForModel", () => {
  it("writes each slide as „სლაიდი n: title“ and its text", () => {
    expect(formatSlidesForModel([{ title: "შესავალი", text: "პირველი\nმეორე" }, { title: "ბოლო", text: "", notes: "კითხვები" }])).toBe(
      "სლაიდი 1: შესავალი\nპირველი\nმეორე\n\nსლაიდი 2: ბოლო\nშენიშვნები: კითხვები",
    );
  });
});
