/**
 * „ჩამოტვირთვა → Word (.docx)“: a conspectus as a Word document, built in
 * the browser with JSZip (no server, no extra library). Headings, lists,
 * **bold**, tables, the „დაიმახსოვრე“ note and the conclusions keep their
 * look; a formula is its LaTeX (Word can't read KaTeX).
 */
import JSZip from "jszip";
import { parseInline, type MarkdownBlock } from "./markdown-blocks";
import { documentItems } from "./conspectus-document";

const FONT = "Sylfaen";

const escapeXml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function run(text: string, props = ""): string {
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ""}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

/** Inline markdown as Word runs. */
export function inlineRuns(text: string, base = ""): string {
  return parseInline(text)
    .map((segment) => {
      if (segment.type === "bold") return run(segment.text, `<w:b/>${base}`);
      if (segment.type === "code") return run(segment.text, `<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>${base}`);
      if (segment.type === "math") return run(segment.latex, `<w:i/>${base}`);
      return run(segment.text, base);
    })
    .join("");
}

function paragraph(runs: string, props = ""): string {
  return `<w:p>${props ? `<w:pPr>${props}</w:pPr>` : ""}${runs}</w:p>`;
}

const SHADE = (fill: string) => `<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>`;

function table(header: string[], rows: string[][]): string {
  const border = `<w:top w:val="single" w:sz="4" w:color="D4D4D8"/><w:left w:val="single" w:sz="4" w:color="D4D4D8"/><w:bottom w:val="single" w:sz="4" w:color="D4D4D8"/><w:right w:val="single" w:sz="4" w:color="D4D4D8"/><w:insideH w:val="single" w:sz="4" w:color="D4D4D8"/><w:insideV w:val="single" w:sz="4" w:color="D4D4D8"/>`;
  const cell = (text: string, head: boolean) =>
    `<w:tc><w:tcPr>${head ? SHADE("F4F4F5") : ""}</w:tcPr>${paragraph(inlineRuns(text, head ? "<w:b/>" : ""))}</w:tc>`;
  const row = (cells: string[], head: boolean) => `<w:tr>${cells.map((text) => cell(text, head)).join("")}</w:tr>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${border}</w:tblBorders></w:tblPr>${row(header, true)}${rows.map((cells) => row(cells, false)).join("")}</w:tbl>${paragraph("")}`;
}

/** One markdown block as Word paragraphs; `shade` fills its background (the conclusions). */
function blockXml(block: MarkdownBlock, shade = ""): string {
  const fill = shade ? SHADE(shade) : "";
  switch (block.type) {
    case "heading":
      return paragraph(inlineRuns(block.text), `<w:pStyle w:val="Heading${block.level}"/>${fill}`);
    case "paragraph":
      return paragraph(inlineRuns(block.text), fill);
    case "quote":
      return paragraph(inlineRuns(block.text, "<w:i/>"), `<w:ind w:left="567"/>${fill}`);
    case "list":
      return block.items
        .map((item, index) => paragraph(run(block.ordered ? `${index + 1}. ` : "• ") + inlineRuns(item), `<w:ind w:left="567" w:hanging="283"/><w:spacing w:after="60"/>${fill}`))
        .join("");
    case "math":
      return paragraph(run(block.closed ? block.latex : block.source, "<w:i/>"), `<w:jc w:val="center"/>${fill}`);
    case "code":
      return block.code
        .split("\n")
        .map((line) => paragraph(run(line, `<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="20"/>`), `<w:spacing w:after="0"/>${SHADE("F4F4F5")}`))
        .join("");
    case "table":
      return table(block.header, block.rows);
  }
}

export function conspectusDocumentXml(title: string, meta: string, content: string): string {
  const body = [
    paragraph(run(title), `<w:pStyle w:val="Title"/>`),
    meta ? paragraph(run(meta, `<w:color w:val="71717A"/><w:sz w:val="20"/>`)) : "",
    ...documentItems(content).map((item) => {
      if (item.kind === "remember") {
        return paragraph(run("დაიმახსოვრე: ", `<w:b/><w:color w:val="1E3A8A"/>`) + inlineRuns(item.text, `<w:color w:val="1E3A8A"/>`), `<w:ind w:left="170" w:right="170"/>${SHADE("EFF6FF")}`);
      }
      if (item.kind === "takeaways") {
        return [
          paragraph(inlineRuns(item.title, `<w:color w:val="166534"/>`), `<w:pStyle w:val="Heading2"/>${SHADE("F0FDF4")}`),
          ...item.blocks.map((block) => blockXml(block, "F0FDF4")),
        ].join("");
      }
      return blockXml(item.block);
    }),
  ].join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}" w:eastAsia="${FONT}"/><w:sz w:val="24"/><w:color w:val="27272A"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="18181B"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="18181B"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="320" w:after="120"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="18181B"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:sz w:val="27"/><w:color w:val="18181B"/></w:rPr></w:style></w:styles>`;

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

const DOCUMENT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** The .docx file's bytes. */
export async function conspectusDocx(title: string, meta: string, content: string): Promise<Blob> {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES);
  zip.file("_rels/.rels", ROOT_RELS);
  zip.file("word/_rels/document.xml.rels", DOCUMENT_RELS);
  zip.file("word/styles.xml", STYLES);
  zip.file("word/document.xml", conspectusDocumentXml(title, meta, content));
  return zip.generateAsync({ type: "blob", mimeType: DOCX_MIME });
}
