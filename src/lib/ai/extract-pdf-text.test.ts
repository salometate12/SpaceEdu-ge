import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  extractTextFromPdfBuffer,
  extractTextFromPdfFile,
  normalizeExtractedText,
  stripHeadersAndFooters,
  PDF_ENCODING_ERROR,
  PdfExtractError,
} = await import("./extract-pdf-text");

// Regenerate with: node __tests__/fixtures/syllabus/generate.mjs
const FIXTURES = join(process.cwd(), "__tests__/fixtures/syllabus");

function fixture(name: string): File {
  return new File([readFileSync(join(FIXTURES, name))], name, { type: "application/pdf" });
}

describe("extractTextFromPdfFile", () => {
  it("keeps each table row on its own line with columns separated", async () => {
    const text = await extractTextFromPdfFile(fixture("table-dates.pdf"));
    const lines = text.split("\n");

    expect(lines).toContain("კვირა | თარიღი | თემა | შეფასება");
    expect(lines).toContain("3 | 28.09 | უწყვეტობა | ქვიზი 1");
    expect(lines).toContain("6 | 19.10 | ჯაჭვური წესი | ქვიზი 2");
    expect(lines).toContain("ქვიზი | 4 | 4 × 5 ქულა");
    // pdf-parse's own renderer produced "328.09უწყვეტობაქვიზი 1" here.
    expect(text).not.toMatch(/\d{3}\.\d{2}/);
  });

  it("marks page breaks and keeps a schedule that runs onto the next page", async () => {
    const text = await extractTextFromPdfFile(fixture("table-dates.pdf"));
    expect(text.startsWith("--- გვერდი 1 ---\n")).toBe(true);
    const page2 = text.indexOf("--- გვერდი 2 ---");
    expect(page2).toBeGreaterThan(0);
    expect(text.indexOf("12 | 30.11 | ნაწილობითი ინტეგრება | ქვიზი 4")).toBeGreaterThan(page2);
    expect(text).toContain("15 | 20.01 | ფინალური გამოცდა | ფინალური");
  });

  it("drops the running header and page numbers but not the repeated table header", async () => {
    const text = await extractTextFromPdfFile(fixture("table-dates.pdf"));
    expect(text).not.toContain("თბილისის სახელმწიფო უნივერსიტეტი");
    expect(text).not.toMatch(/გვერდი \d \/ 2/);
    expect(text.match(/კვირა \| თარიღი \| თემა \| შეფასება/g)).toHaveLength(2);
  });

  it("keeps prose line by line", async () => {
    const text = await extractTextFromPdfFile(fixture("week-numbers.pdf"));
    const lines = text.split("\n");
    expect(lines).toContain("ქვიზი 2 — მე-6 კვირა, ხუთშაბათი.");
    expect(lines).toContain("ქვიზი 3 ჩატარდება მე-12 კვირის სამშაბათს.");
    expect(lines).toContain("შუალედური გამოცდა: VIII კვირა.");
  });

  it("reports unreadable Georgian font encoding instead of returning garbage", async () => {
    const result = extractTextFromPdfFile(fixture("broken-encoding.pdf"));
    await expect(result).rejects.toBeInstanceOf(PdfExtractError);
    await expect(result).rejects.toThrow(PDF_ENCODING_ERROR);
  });
});

describe("extractTextFromPdfBuffer", () => {
  it("reads a small Buffer that is a view into Node's shared pool", async () => {
    const bytes = readFileSync(join(FIXTURES, "week-numbers.pdf"));
    // Buffer.from(Uint8Array) allocates small copies from the pool, at a non-zero offset.
    const pooled = Buffer.concat([Buffer.from("x"), bytes]).subarray(1);
    expect(pooled.byteOffset).toBeGreaterThan(0);
    await expect(extractTextFromPdfBuffer(pooled)).resolves.toContain("ქვიზი 2 — მე-6 კვირა, ხუთშაბათი.");
  });
});

describe("normalizeExtractedText", () => {
  it("collapses horizontal whitespace and extra blank lines only", () => {
    expect(normalizeExtractedText("ქვიზი  1\t\t| 12.10  \r\n\n\n\n\nშუალედური")).toBe(
      "ქვიზი 1 | 12.10\n\nშუალედური",
    );
  });
});

describe("stripHeadersAndFooters", () => {
  const body = ["პირველი", "მეორე", "მესამე"];

  it("removes lines repeated at the edges of most pages", () => {
    const pages = [1, 2, 3].map((n) =>
      [
        "კურსის კოდი: MATH-101",
        `თემა ${body[n - 1]}`,
        "შიგთავსი",
        "მეტი შიგთავსი",
        `დასკვნა ${body[n - 1]}`,
        `გვერდი ${n} / 3`,
      ].join("\n"),
    );
    expect(stripHeadersAndFooters(pages)).toEqual(
      body.map((word) => `თემა ${word}\nშიგთავსი\nმეტი შიგთავსი\nდასკვნა ${word}`),
    );
  });

  it("never drops an event line, even one repeated at every page edge", () => {
    const pages = [1, 2, 3].map((n) =>
      [`ქვიზი ${n}`, `შიგთავსი ${body[n - 1]}`, "მეტი", "კიდევ", "ბოლო"].join("\n"),
    );
    expect(stripHeadersAndFooters(pages).map((page) => page.split("\n")[0])).toEqual([
      "ქვიზი 1",
      "ქვიზი 2",
      "ქვიზი 3",
    ]);
  });
});
