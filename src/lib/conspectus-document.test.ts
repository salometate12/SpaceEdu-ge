import { describe, expect, it } from "vitest";
import { documentContents, documentItems, readingMinutes, safeFileName, sourceLine } from "./conspectus-document";
import { conspectusDocumentXml } from "./conspectus-docx";

const SAMPLE = [
  "# ფუნქციის ზღვარი",
  "",
  "შესავალი **ზღვარზე**.",
  "",
  "## განმარტება",
  "",
  "> **დაიმახსოვრე:** ზღვარი შეიძლება არ ემთხვეოდეს მნიშვნელობას.",
  "",
  "### მაგალითი",
  "",
  "> ჩვეულებრივი ციტატა",
  "",
  "## ძირითადი დასკვნები",
  "",
  "- პირველი",
  "- მეორე",
].join("\n");

describe("conspectus document", () => {
  it("leaves out the # title, makes the remember note and the conclusions their own blocks", () => {
    const items = documentItems(SAMPLE);
    expect(items[0]).toEqual({ kind: "block", block: { type: "paragraph", text: "შესავალი **ზღვარზე**." } });
    expect(items.some((item) => item.kind === "block" && item.block.type === "heading" && item.block.level === 1)).toBe(false);
    expect(items).toContainEqual({ kind: "remember", text: "ზღვარი შეიძლება არ ემთხვეოდეს მნიშვნელობას." });
    expect(items).toContainEqual({ kind: "block", block: { type: "quote", text: "ჩვეულებრივი ციტატა" } });
    const takeaways = items.find((item) => item.kind === "takeaways");
    expect(takeaways).toMatchObject({ kind: "takeaways", title: "ძირითადი დასკვნები", blocks: [{ type: "list", items: ["პირველი", "მეორე"] }] });
  });

  it("contents: every ## heading in order, with the ids the headings get", () => {
    const items = documentItems(SAMPLE);
    const contents = documentContents(items);
    expect(contents.map((entry) => entry.text)).toEqual(["განმარტება", "ძირითადი დასკვნები"]);
    const ids = items.flatMap((item) => (item.kind === "takeaways" ? [item.id] : item.kind === "block" && item.id ? [item.id] : []));
    expect(ids).toEqual(["განმარტება", "მაგალითი", "ძირითადი-დასკვნები"]);
    expect(contents[1].id).toBe("ძირითადი-დასკვნები");
  });

  it("a # that isn't first stays (a second document title is content)", () => {
    const items = documentItems("შესავალი\n\n# კიდევ ერთი");
    expect(items[1]).toEqual({ kind: "block", block: { type: "heading", level: 1, text: "კიდევ ერთი" } });
  });

  it("minutes to read, the source line and a safe file name", () => {
    expect(readingMinutes("სიტყვა ".repeat(50))).toBe(1);
    expect(readingMinutes("სიტყვა ".repeat(1000))).toBe(5);
    expect(sourceLine("3 ფაილი")).toBe("3 ფაილიდან");
    expect(sourceLine("ლექცია 2.pdf")).toBe("ლექცია 2.pdf");
    expect(sourceLine(undefined)).toBeNull();
    expect(safeFileName('ზღვარი: "a/b"')).toBe("ზღვარი a b");
  });

  it("Word: title, meta, headings, bold, the blocks shaded, text escaped", () => {
    const xml = conspectusDocumentXml("ზღვარი <1>", "კონსპექტი · 1 წთ საკითხავი", `${SAMPLE}\n\n| a | b |\n|---|---|\n| 1 | 2 |`);
    expect(xml).toContain('<w:pStyle w:val="Title"/>');
    expect(xml).toContain("ზღვარი &lt;1&gt;");
    expect(xml).toContain('<w:pStyle w:val="Heading2"/>');
    expect(xml).toContain("<w:b/></w:rPr><w:t xml:space=\"preserve\">ზღვარზე</w:t>");
    expect(xml).toContain('w:fill="EFF6FF"');
    expect(xml).toContain('w:fill="F0FDF4"');
    expect(xml).toContain("<w:tbl>");
    expect(xml).not.toContain("# ფუნქციის");
  });
});
