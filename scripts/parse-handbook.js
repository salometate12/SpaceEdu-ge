/**
 * Extracts university programs from ცნობარი_2026_15.pdf (pages 35–1274).
 * Run: npm run parse-handbook
 */
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

const ROOT = path.join(__dirname, "..");
const PDF_PATH =
  process.env.HANDBOOK_PDF_PATH ||
  path.join(ROOT, "data", "ცნობარი_2026_15.pdf");
const OUT_PATH = path.join(ROOT, "data", "universities.json");

const PAGE_START = 35;
const PAGE_END = 1274;

const GLYPH_GEORGIAN = "̧̲̝̭̤̰̥";
const GLYPH_FOREIGN = "̷̰̻̪̰̭̥";

const GLYPH_TO_SUBJECT = {
  [GLYPH_GEORGIAN]: "georgian",
  [GLYPH_FOREIGN]: "foreign_language",
  "̡̟̭": "math",
  "̥̩̟": "physics",
  "̭̰̮": "chemistry",
  "̱̭̝̩": "biology",
  "̥̮̯̪̭̥̝": "history",
  "̧̡̥̯̭̝̯̰̭̝": "geography",
  "̨̡̨̝̤̝̯̥̦̝": "physics",
  "̱̥̣̥̦̝": "math",
  "̨̡̭̝̞": "civics",
};

function decodePdfNumbers(text, isElectiveRow) {
  const nums = [];
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    if (c >= 14 && c <= 31) {
      nums.push(isElectiveRow ? c - 6 : c);
    }
  }
  return nums;
}

function tailThreshold(line, isElectiveRow) {
  const tabIdx = line.indexOf("\t");
  const numPart = tabIdx >= 0 ? line.slice(0, tabIdx) : line;
  const nums = decodePdfNumbers(numPart, isElectiveRow);
  if (!nums.length) return null;
  if (isElectiveRow) return nums[0];
  if (nums.length >= 3) return nums[nums.length - 3];
  return nums[0];
}

function findSubjectsInSegment(segment) {
  const hits = [];
  const sorted = Object.keys(GLYPH_TO_SUBJECT).sort((a, b) => b.length - a.length);
  for (const glyph of sorted) {
    if (segment.includes(glyph)) {
      const id = GLYPH_TO_SUBJECT[glyph];
      if (!hits.includes(id)) hits.push(id);
    }
  }
  return hits;
}

function splitOrSegments(line) {
  if (line.includes("\f")) {
    return line.split("\f").map((s) => s.trim()).filter(Boolean);
  }
  return [line];
}

function cleanFacultyTitle(raw) {
  return raw.replace(/\u0004/g, " ").replace(/\s+/g, " ").trim();
}

function extractLatinHint(text) {
  const m = text.match(/[A-Z]{4,}[A-Z$[\]]*/g);
  return m ? m.join(" ").replace(/[$[\]]/g, "").trim() : null;
}

function renderPage(pageData) {
  return pageData
    .getTextContent({
      normalizeWhitespace: false,
      disableCombineTextItems: false,
    })
    .then((textContent) => {
      let lastY = null;
      let text = "";
      for (const item of textContent.items) {
        if (lastY === item.transform[5] || lastY === null) text += item.str;
        else text += "\n" + item.str;
        lastY = item.transform[5];
      }
      return text;
    });
}

function parseProgramBlock(lines, institutionCode, page, unreadablePages) {
  const header = lines.find((l) => /^\d{7}\s/.test(l));
  if (!header) return null;

  const match = header.match(/^(\d{7})\s+(.+)$/);
  if (!match) return null;

  const code = match[1];
  const faculty = cleanFacultyTitle(match[2]);

  const examHeaderIdx = lines.findIndex((l) => l.includes("გამოცდა"));
  const electiveHeaderIdx = lines.findIndex((l) => l.includes("ერთ-ერთი"));
  if (examHeaderIdx === -1) {
    unreadablePages.push({ page, code, reason: "missing_exam_table" });
    return null;
  }

  let slots = null;
  const accredLine = lines.find((l) => l.includes("აკრედიტაცია") && l.length > 40);
  if (accredLine) {
    const nums = decodePdfNumbers(accredLine, false);
    if (nums.length) slots = nums[nums.length - 1];
  }

  const mandatory = [];
  const oneOf = [];

  const examEnd = electiveHeaderIdx === -1 ? lines.length : electiveHeaderIdx;
  for (let i = examHeaderIdx + 1; i < examEnd; i++) {
    const line = lines[i];
    if (!line || line.length < 3) continue;

    if (line.startsWith(GLYPH_GEORGIAN)) {
      const minThreshold = tailThreshold(line, false);
      if (minThreshold != null) {
        mandatory.push({ subjectId: "georgian", minThreshold });
      }
      continue;
    }

    if (line.startsWith(GLYPH_FOREIGN)) {
      const minThreshold = tailThreshold(line, false);
      if (minThreshold != null) {
        mandatory.push({ subjectId: "foreign_language", minThreshold });
      }
    }

    const segments = splitOrSegments(line);
    const orGroup = [];
    for (const segment of segments) {
      const subjects = findSubjectsInSegment(segment);
      const minThreshold = tailThreshold(segment, false);
      for (const subjectId of subjects) {
        if (subjectId === "foreign_language" && line.startsWith(GLYPH_FOREIGN)) continue;
        if (minThreshold != null) {
          orGroup.push({ subjectId, minThreshold });
        }
      }
    }
    if (orGroup.length > 0) {
      oneOf.push(orGroup);
    }
  }

  if (electiveHeaderIdx !== -1) {
    const electiveGroup = [];
    for (let i = electiveHeaderIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("\u0014\u0014") || line.includes("̮̮̥̫")) break;
      const subjects = findSubjectsInSegment(line);
      const minThreshold = tailThreshold(line, true);
      if (!subjects.length || minThreshold == null) continue;
      for (const subjectId of subjects) {
        electiveGroup.push({ subjectId, minThreshold });
      }
    }
    if (electiveGroup.length) {
      const electiveIds = new Set(electiveGroup.map((e) => e.subjectId));
      const alreadyCovered = oneOf.some((group) => {
        const groupIds = new Set(group.map((e) => e.subjectId));
        return [...electiveIds].every((id) => groupIds.has(id));
      });
      if (!alreadyCovered) oneOf.push(electiveGroup);
    }
  }

  return {
    code,
    institutionCode,
    faculty,
    slots,
    page,
    exams: { mandatory, oneOf },
  };
}

async function extractPages() {
  if (!fs.existsSync(PDF_PATH)) {
    console.error(`PDF not found: ${PDF_PATH}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(PDF_PATH);
  const pageTexts = new Map();
  const unreadablePages = [];

  await pdf(buffer, {
    max: 0,
    pagerender: async (pageData) => {
      const n = pageData.pageNumber;
      if (n < PAGE_START || n > PAGE_END) return "";
      try {
        const text = await renderPage(pageData);
        pageTexts.set(n, text);
      } catch (err) {
        unreadablePages.push({ page: n, reason: err.message || "render_error" });
      }
      return "";
    },
  });

  const institutions = new Map();
  const programs = [];
  let currentInstitution = null;

  const sortedPages = [...pageTexts.keys()].sort((a, b) => a - b);

  for (const page of sortedPages) {
    const text = pageTexts.get(page);
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const programHeader = lines.find((l) => /^\d{7}\s/.test(l));
    if (!programHeader) continue;

    const instCode = programHeader.slice(0, 3);
    if (instCode !== currentInstitution) {
      currentInstitution = instCode;
      if (!institutions.has(instCode)) {
        const hint = extractLatinHint(text);
        institutions.set(instCode, {
          code: instCode,
          hint: hint || null,
          name: hint ? null : `დაწესებულება ${instCode}`,
          startPage: page,
        });
      }
    }

    const program = parseProgramBlock(lines, currentInstitution, page, unreadablePages);
    if (program) programs.push(program);
  }

  const output = {
    meta: {
      source: path.basename(PDF_PATH),
      pageRange: `${PAGE_START}-${PAGE_END}`,
      extractedAt: new Date().toISOString(),
      programCount: programs.length,
      institutionCount: institutions.size,
      unreadablePages,
    },
    institutions: [...institutions.values()],
    programs,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), "utf8");

  console.log(`Wrote ${programs.length} programs, ${institutions.size} institutions`);
  console.log(`Output: ${OUT_PATH}`);
  if (unreadablePages.length) {
    console.log(`Unreadable/partial pages: ${unreadablePages.length}`);
  }
}

extractPages().catch((err) => {
  console.error(err);
  process.exit(1);
});
