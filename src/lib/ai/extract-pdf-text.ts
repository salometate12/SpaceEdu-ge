import "server-only";

const MAX_PDF_BYTES = 15 * 1024 * 1024;
const MIN_EXTRACTED_CHARS = 50;
const MAX_EXTRACTED_CHARS = 120_000;

export const PDF_TEXT_EMPTY_ERROR =
  "ფაილი ცარიელია ან ვერ მოხერხდა ტექსტის ამოცნობა";

export const PDF_ENCODING_ERROR =
  "PDF-ის ტექსტი ვერ წავიკითხეთ — ფაილში გამოყენებული შრიფტის კოდირება ქართულ ასოებს არასწორად ინახავს. " +
  "გახსენი დოკუმენტი Word-ში ან Google Docs-ში და ხელახლა შეინახე PDF-ად (Unicode შრიფტით, მაგ. Sylfaen), ან ატვირთე სხვა ვერსია.";

export class PdfExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfExtractError";
  }
}

/** The slice of a pdf.js text item we read. */
interface PdfTextItem {
  str: string;
  /** [a, b, c, d, x, y] — PDF user space, origin bottom-left. */
  transform: number[];
  width?: number;
  height?: number;
}

interface PdfPageData {
  pageIndex?: number;
  getTextContent: (options?: {
    normalizeWhitespace?: boolean;
    disableCombineTextItems?: boolean;
  }) => Promise<{ items: PdfTextItem[] }>;
}

type PdfParseFn = (
  data: Uint8Array,
  options?: { pagerender?: (pageData: PdfPageData) => Promise<string> },
) => Promise<{ text: string; numpages?: number }>;

/** A cell gap wider than this many font sizes is a table column break. */
const COLUMN_GAP_FACTOR = 1.2;

/**
 * Rebuilds one page's text from positioned text items: items on the same
 * baseline become one line (sorted left to right), lines run top to bottom,
 * and a wide horizontal gap between items — a table column — becomes " | ".
 * pdf-parse's own renderer glues cells together ("1" + "14.09" → "114.09")
 * and only breaks lines on exact y equality.
 */
export function renderPageItems(items: PdfTextItem[]): string {
  const positioned = items
    .filter((item) => item.str && item.str.trim().length > 0)
    .map((item) => {
      const [a = 0, b = 0, c = 0, d = 0, x = 0, y = 0] = item.transform;
      const fontSize = Math.max(Math.hypot(c, d), Math.hypot(a, b), item.height ?? 0) || 10;
      const width = item.width ?? item.str.length * fontSize * 0.5;
      return { str: item.str, x, y, fontSize, width };
    });

  type Row = { y: number; fontSize: number; cells: typeof positioned };
  const rows: Row[] = [];
  for (const item of [...positioned].sort((p, q) => q.y - p.y || p.x - q.x)) {
    const row = rows.find(
      (candidate) => Math.abs(candidate.y - item.y) <= Math.max(2, Math.min(candidate.fontSize, item.fontSize) * 0.45),
    );
    if (row) {
      row.cells.push(item);
    } else {
      rows.push({ y: item.y, fontSize: item.fontSize, cells: [item] });
    }
  }

  rows.sort((p, q) => q.y - p.y);

  return rows
    .map((row) => {
      const cells = [...row.cells].sort((p, q) => p.x - q.x);
      let line = "";
      let prevEnd: number | null = null;
      for (const cell of cells) {
        if (prevEnd !== null) {
          const gap = cell.x - prevEnd;
          if (gap > cell.fontSize * COLUMN_GAP_FACTOR) {
            line = `${line.trimEnd()} | `;
          } else if (gap > cell.fontSize * 0.15 && !/\s$/.test(line) && !/^\s/.test(cell.str)) {
            line += " ";
          }
        }
        line += line.endsWith(" | ") ? cell.str.trimStart() : cell.str;
        prevEnd = cell.x + cell.width;
      }
      return line;
    })
    .join("\n");
}

/** Collapses horizontal whitespace but keeps line breaks — the line and
 * table-row structure is what tells a date which row it belongs to. */
export function normalizeExtractedText(raw: string): string {
  return raw
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t \f\v]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const PAGE_NUMBER_LINE =
  /^(?:[-–—\s]*\d{1,4}[-–—\s]*|(?:გვ(?:ერდი)?\.?|page|p\.)\s*\d{1,4}(?:\s*(?:\/|of|-დან|დან)\s*\d{1,4})?|\d{1,4}\s*(?:\/|of)\s*\d{1,4})$/iu;

/** A line's identity across pages: the page's own number and the page
 * count are masked, nothing else — "გვერდი 3 / 12" repeats, "ქვიზი 3" doesn't. */
function headerFooterKey(line: string, pageNumber: number, pageCount: number): string {
  return line
    .replace(/\d+/g, (digits) =>
      Number(digits) === pageNumber || Number(digits) === pageCount ? "#" : digits,
    )
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Lines that carry a syllabus event are never page furniture. */
const EVENT_LINE =
  /ქვიზ|კვიზ|შუალედ|ფინალ|გამოცდ|საკონტროლ|ტესტ|დედლაინ|კვირ|quiz|exam|midterm|final|deadline|week|\d{1,2}\s*[./]\s*\d{1,2}/iu;

/**
 * Drops page furniture: bare page-number lines anywhere near a page edge,
 * and lines that repeat at the top or bottom of most pages (university
 * name, course code, "გვერდი 3 / 12"). Multi-column rows are never dropped
 * — a repeated table header row is content, not a running header.
 */
export function stripHeadersAndFooters(pages: string[]): string[] {
  const EDGE = 2;
  const split = pages.map((page) => page.split("\n").filter((line) => line.trim()));

  const edgeCounts = new Map<string, number>();
  split.forEach((lines, pageIndex) => {
    const edges = new Set(
      [...lines.slice(0, EDGE), ...lines.slice(-EDGE)].map((line) =>
        headerFooterKey(line, pageIndex + 1, pages.length),
      ),
    );
    for (const key of edges) edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
  });
  const threshold = Math.max(2, Math.ceil(pages.length * 0.5));
  const repeated = new Set(
    [...edgeCounts].filter(([, count]) => pages.length >= 2 && count >= threshold).map(([key]) => key),
  );

  return split.map((lines, pageIndex) =>
    lines
      .filter((line, index) => {
        const atEdge = index < EDGE || index >= lines.length - EDGE;
        if (!atEdge) return true;
        if (PAGE_NUMBER_LINE.test(line.trim())) return false;
        if (line.split(" | ").length >= 3 || EVENT_LINE.test(line)) return true;
        return !repeated.has(headerFooterKey(line, pageIndex + 1, pages.length));
      })
      .join("\n"),
  );
}

/**
 * True when the text is mostly mis-encoded glyphs: Private Use Area code
 * points, U+FFFD, control characters or stray Latin-1 accented letters —
 * what a PDF with a legacy (non-Unicode) Georgian font extracts to.
 */
export function looksLikeBrokenEncoding(text: string): boolean {
  const letters = text.match(/[\p{L}-�]/gu)?.length ?? 0;
  if (letters === 0) return false;
  const suspicious =
    text.match(/[-�\u0001-\u0008\u000B\u000E-\u001F\u007F-\u009FÀ-ÿ]/gu)?.length ?? 0;
  return suspicious / letters > 0.2;
}

function looksLikeBinaryPdfDump(text: string): boolean {
  const sample = text.slice(0, 200);
  return (
    sample.startsWith("%PDF") ||
    /\/Type\s*\/XRef/i.test(sample) ||
    /endobj/i.test(sample)
  );
}

async function loadPdfParse(): Promise<PdfParseFn> {
  // The library entry point ("pdf-parse") runs a debug self-test that reads
  // a bundled sample file whenever it isn't require()d from CommonJS; the
  // lib path is the parser alone.
  const loaded = await import("pdf-parse/lib/pdf-parse.js");
  return (loaded.default ?? loaded) as unknown as PdfParseFn;
}

/** Extracts each page's text, one string per page, in page order. */
async function extractPages(buffer: Buffer): Promise<string[]> {
  const pdfParse = await loadPdfParse();
  const pages: string[] = [];
  let fallbackIndex = 0;
  // pdf.js reads the underlying ArrayBuffer from offset 0 and ignores
  // `byteOffset`, so a small Buffer (a view into Node's shared pool) parses
  // as garbage. `new Uint8Array(buffer)` copies into its own ArrayBuffer;
  // `Buffer.from(...)` would land back in the pool.
  const data = new Uint8Array(buffer);
  await pdfParse(data, {
    pagerender: async (pageData) => {
      const index = pageData.pageIndex ?? fallbackIndex;
      fallbackIndex += 1;
      const content = await pageData.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false,
      });
      const text = renderPageItems(content.items);
      pages[index] = text;
      return text;
    },
  });
  return Array.from(pages, (page) => page ?? "");
}

/** Joins pages with a visible "--- გვერდი N ---" marker so a schedule
 * that runs across a page break is still read as one table. */
export function joinPages(pages: string[]): string {
  return pages
    .map((page, index) => ({ page: normalizeExtractedText(page), number: index + 1 }))
    .filter(({ page }) => page.length > 0)
    .map(({ page, number }) => `--- გვერდი ${number} ---\n${page}`)
    .join("\n\n");
}

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  let pages: string[];
  try {
    pages = await extractPages(buffer);
  } catch {
    throw new PdfExtractError(PDF_TEXT_EMPTY_ERROR);
  }

  const body = stripHeadersAndFooters(pages.map(normalizeExtractedText));
  const contentOnly = body.join("\n");

  if (contentOnly.replace(/\s+/g, "").length < MIN_EXTRACTED_CHARS || looksLikeBinaryPdfDump(contentOnly)) {
    throw new PdfExtractError(PDF_TEXT_EMPTY_ERROR);
  }
  if (looksLikeBrokenEncoding(contentOnly)) {
    throw new PdfExtractError(PDF_ENCODING_ERROR);
  }

  return joinPages(body).slice(0, MAX_EXTRACTED_CHARS);
}

export async function extractTextFromPdfFile(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new PdfExtractError(PDF_TEXT_EMPTY_ERROR);
  }

  if (file.size > MAX_PDF_BYTES) {
    throw new PdfExtractError("PDF ფაილი ძალიან დიდია. მაქსიმუმ 15 MB.");
  }

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    throw new PdfExtractError("მხოლოდ PDF ფორმატის ფაილია დაშვებული.");
  }

  const arrayBuffer = await file.arrayBuffer();
  return extractTextFromPdfBuffer(Buffer.from(arrayBuffer));
}
