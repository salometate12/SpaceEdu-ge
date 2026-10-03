// Generates the syllabus fixture PDFs used by src/lib/ai/extract-pdf-text.test.ts.
//
//   node __tests__/fixtures/syllabus/generate.mjs
//
// The PDFs are written by hand, with no embedded font file: text uses an
// Identity-H Type0 font whose ToUnicode CMap maps every code straight to
// its Unicode code point — the same shape Word/LibreOffice exports have, so
// pdf.js extracts real Georgian text from it. Each text run is placed at an
// absolute position, which is what makes a table a table.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_W = 595;
const PAGE_H = 842;
const FONT_SIZE = 10;

function hexUtf16(text) {
  let hex = "";
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code > 0xffff) throw new Error(`Non-BMP character: ${ch}`);
    hex += code.toString(16).padStart(4, "0").toUpperCase();
  }
  return hex;
}

/** ToUnicode CMap. `georgianTarget` lets the "broken" fixture remap
 * Georgian (U+10D0…) onto Latin-1 (U+00D0… "ÐÑÒ"), the mojibake a PDF
 * with a legacy non-Unicode Georgian font extracts to. */
function toUnicodeCMap(georgianTarget = 0x1000) {
  const ranges = [0x00, 0x10, 0x20, 0x21].map((hi) => {
    const lo = hi << 8;
    const target = hi === 0x10 ? georgianTarget : lo;
    const h = (n) => `<${n.toString(16).padStart(4, "0").toUpperCase()}>`;
    return `${h(lo)} ${h(lo + 0xff)} ${h(target)}`;
  });
  return [
    "/CIDInit /ProcSet findresource begin",
    "12 dict begin",
    "begincmap",
    "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def",
    "/CMapName /Adobe-Identity-UCS def",
    "/CMapType 2 def",
    "1 begincodespacerange",
    "<0000> <FFFF>",
    "endcodespacerange",
    `${ranges.length} beginbfrange`,
    ...ranges,
    "endbfrange",
    "endcmap",
    "CMapName currentdict /CMap defineresource pop",
    "end",
    "end",
  ].join("\n");
}

/**
 * pages: Array<Array<{ x, y, text }>> — y measured from the top of the page.
 */
function buildPdf(pages, { georgianTarget } = {}) {
  const objects = [];
  const add = (body) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = add(null);
  const pagesId = add(null);
  const descriptorId = add(
    "<< /Type /FontDescriptor /FontName /SyllabusTest /Flags 32 /FontBBox [0 -200 1000 900] /ItalicAngle 0 /Ascent 900 /Descent -200 /CapHeight 700 /StemV 80 >>",
  );
  const cidFontId = add(
    `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /SyllabusTest /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${descriptorId} 0 R /DW 500 /CIDToGIDMap /Identity >>`,
  );
  const cmap = toUnicodeCMap(georgianTarget);
  const cmapId = add(`<< /Length ${Buffer.byteLength(cmap)} >>\nstream\n${cmap}\nendstream`);
  const fontId = add(
    `<< /Type /Font /Subtype /Type0 /BaseFont /SyllabusTest /Encoding /Identity-H /DescendantFonts [${cidFontId} 0 R] /ToUnicode ${cmapId} 0 R >>`,
  );

  const pageIds = pages.map((runs) => {
    const content = runs
      .map(
        ({ x, y, text }) =>
          `BT /F1 ${FONT_SIZE} Tf 1 0 0 1 ${x} ${PAGE_H - y} Tm <${hexUtf16(text)}> Tj ET`,
      )
      .join("\n");
    const contentId = add(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
    return add(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
  });

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "binary");
}

/** Lays out a table: each row is an array of cell strings placed in columns. */
function table(columns, rows, top, lineHeight = 16) {
  return rows.flatMap((cells, rowIndex) =>
    cells
      .map((text, col) => ({ x: columns[col], y: top + rowIndex * lineHeight, text }))
      .filter((run) => run.text),
  );
}

function lines(texts, top, x = 50, lineHeight = 16) {
  return texts.map((text, index) => ({ x, y: top + index * lineHeight, text }));
}

function withHeaderFooter(pages) {
  return pages.map((runs, index) => [
    { x: 50, y: 30, text: "ივანე ჯავახიშვილის სახელობის თბილისის სახელმწიფო უნივერსიტეტი" },
    ...runs,
    { x: 270, y: 815, text: `გვერდი ${index + 1} / ${pages.length}` },
  ]);
}

// 1. A table with explicit DD.MM dates, schedule continuing onto page 2.
const SCHEDULE_COLUMNS = [50, 90, 150, 420];
const scheduleHeader = ["კვირა", "თარიღი", "თემა", "შეფასება"];
const scheduleRows = [
  ["1", "14.09", "შესავალი, ფუნქციები", ""],
  ["2", "21.09", "ზღვარი", ""],
  ["3", "28.09", "უწყვეტობა", "ქვიზი 1"],
  ["4", "05.10", "წარმოებული", ""],
  ["5", "12.10", "გაწარმოების წესები", ""],
  ["6", "19.10", "ჯაჭვური წესი", "ქვიზი 2"],
  ["7", "26.10", "გამეორება", ""],
  ["8", "02.11", "შუალედური გამოცდა", "შუალედური"],
  ["9", "09.11", "ექსტრემუმები", "ქვიზი 3"],
  ["10", "16.11", "ინტეგრალი", ""],
  ["11", "23.11", "ჩასმის მეთოდი", ""],
  ["12", "30.11", "ნაწილობითი ინტეგრება", "ქვიზი 4"],
  ["13", "07.12", "გამოყენებები", ""],
  ["14", "14.12", "გამეორება", ""],
  ["15", "20.01", "ფინალური გამოცდა", "ფინალური"],
];

const tableDates = buildPdf(
  withHeaderFooter([
    [
      ...lines(["სილაბუსი: მათემატიკური ანალიზი I", "ლექტორი: პროფ. ნ. ბერიძე"], 70),
      ...lines(["შეფასების სისტემა"], 120),
      ...table(
        [50, 250, 380],
        [
          ["კომპონენტი", "რაოდენობა", "ქულა"],
          ["ქვიზი", "4", "4 × 5 ქულა"],
          ["შუალედური გამოცდა", "1", "30 ქულა"],
          ["ფინალური გამოცდა", "1", "40 ქულა"],
        ],
        140,
      ),
      ...lines(["კვირების მიხედვით განრიგი"], 230),
      ...table(SCHEDULE_COLUMNS, [scheduleHeader, ...scheduleRows.slice(0, 8)], 250),
    ],
    [
      ...table(SCHEDULE_COLUMNS, [scheduleHeader, ...scheduleRows.slice(8)], 70),
      ...lines(["ლიტერატურა: სტიუარტი, კალკულუსი."], 220),
    ],
  ]),
);

// 2. Prose that only names weeks and weekdays — no calendar dates at all.
const weekNumbers = buildPdf(
  withHeaderFooter([
    [
      ...lines(
        [
          "სილაბუსი: ეკონომიკის საფუძვლები",
          "კურსი გრძელდება 15 კვირა.",
          "შეფასება: ქვიზები (3 × 10 ქულა), შუალედური (30), ფინალური (40).",
          "",
          "ქვიზი 1 ჩატარდება მე-4 კვირას, ლექციის ბოლოს.",
          "ქვიზი 2 — მე-6 კვირა, ხუთშაბათი.",
          "შუალედური გამოცდა: VIII კვირა.",
        ],
        70,
      ),
    ],
    [
      ...lines(
        [
          "ქვიზი 3 ჩატარდება მე-12 კვირის სამშაბათს.",
          "ფინალური გამოცდა: მე-16 კვირა.",
          "საკურსო ნაშრომის ჩაბარება: მე-14 კვირა, პარასკევი.",
        ],
        70,
      ),
    ],
  ]),
);

// 3. Same text, but the font maps Georgian to Latin-1 mojibake.
const brokenEncoding = buildPdf(
  [
    lines(
      [
        "სილაბუსი: ფიზიკა",
        "ქვიზი 1 ჩატარდება მე-4 კვირას, ლექციის ბოლოს.",
        "შუალედური გამოცდა ჩატარდება მერვე კვირაში.",
        "ფინალური გამოცდა ჩატარდება სესიის პერიოდში.",
      ],
      70,
    ),
  ],
  { georgianTarget: 0x0000 },
);

// 4. A long syllabus (12 pages): grading on page 2, the schedule only on the
//    last two pages, with mixed wording ("კვიზი", "Quiz", "საკონტროლო წერა")
//    and date formats ("12 ოქტომბერი", "ნოემბრის 9", "Week 13").
const filler = (topic) =>
  Array.from({ length: 30 }, (_, i) => `${topic}: აბზაცი ${i + 1} — კურსის მიზნები, მეთოდები და მოთხოვნები სტუდენტისთვის.`);
const longSyllabus = buildPdf(
  withHeaderFooter([
    lines(["სილაბუსი: ორგანული ქიმია", "კრედიტი: 6 ECTS", ...filler("კურსის აღწერა").slice(0, 25)], 70),
    [
      ...lines(["შეფასების კომპონენტები"], 70),
      ...table(
        [50, 300],
        [
          ["კომპონენტი", "ქულა"],
          ["კვიზები (5 × 4 ქულა)", "20"],
          ["ლაბორატორიული ანგარიშების ჩაბარება", "10"],
          ["შუალედური გამოცდა", "30"],
          ["დასკვნითი გამოცდა", "40"],
        ],
        90,
      ),
      ...lines(filler("შეფასების წესი").slice(0, 20), 190),
    ],
    ...["ლიტერატურა", "აკადემიური პატიოსნება", "დასწრება", "ლაბორატორია", "უსაფრთხოება", "კონსულტაციები", "რესურსები"].map(
      (topic) => lines(filler(topic).slice(0, 28), 70),
    ),
    lines(filler("დამატებითი ინფორმაცია").slice(0, 28), 70),
    [
      ...lines(["კალენდარი კვირების მიხედვით"], 70),
      ...table(
        [50, 110, 230, 430],
        [
          ["კვირა", "თარიღი", "თემა", "აქტივობა"],
          ["I", "", "ალკანები", ""],
          ["II", "", "ალკენები", ""],
          ["III", "", "ალკინები", "კვიზი 1"],
          ["IV", "12 ოქტომბერი", "არომატული ნაერთები", ""],
          ["V", "", "სპირტები", "Quiz 2"],
          ["VI", "", "ეთერები", "ლაბ. ანგარიშის ჩაბარება"],
          ["VII", "", "ალდეჰიდები", "საკონტროლო წერა (კვიზი 3)"],
          ["VIII", "ნოემბრის 9", "შუალედური გამოცდა", "შუალედური"],
        ],
        90,
      ),
    ],
    [
      ...table(
        [50, 110, 230, 430],
        [
          ["კვირა", "თარიღი", "თემა", "აქტივობა"],
          ["IX", "", "კეტონები", ""],
          ["X", "", "კარბონმჟავები", "კვიზი 4 (ოთხშაბათი)"],
          ["XI", "", "ამინები", ""],
          ["XII", "", "ამინომჟავები", ""],
          ["XIII", "", "ცილები", "Quiz 5"],
          ["XIV", "", "გამეორება", ""],
        ],
        70,
      ),
      ...lines(["დასკვნითი გამოცდა ჩატარდება სესიის პერიოდში, თარიღს დეკანატი გამოაცხადებს."], 200),
    ],
  ]),
);

writeFileSync(join(OUT_DIR, "long-schedule-at-end.pdf"), longSyllabus);
writeFileSync(join(OUT_DIR, "table-dates.pdf"), tableDates);
writeFileSync(join(OUT_DIR, "week-numbers.pdf"), weekNumbers);
writeFileSync(join(OUT_DIR, "broken-encoding.pdf"), brokenEncoding);
console.log("Wrote syllabus fixtures to", OUT_DIR);
