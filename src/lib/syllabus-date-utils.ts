/**
 * Turning whatever "when" text a syllabus states into a real, placeable
 * YYYY-MM-DD calendar date.
 *
 * The model only reports what the syllabus literally says ("12.10",
 * "მე-7 კვირა, ხუთშაბათი", "Week 8"); every calendar date is computed here,
 * deterministically. Georgian syllabi always write numeric dates day-first
 * (DD.MM), so nothing is ever handed to `new Date(freeText)`, which reads
 * "12.10" as 10 December. When the text gives neither a date nor a week,
 * the result is `null` / "unknown" — a guessed date is worse than none.
 *
 * All arithmetic is done on UTC calendar days so the result never depends
 * on the server's or the browser's time zone.
 */

export type MilestoneDateStatus = "exact" | "computed-from-week" | "unknown";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Georgian month stems, matched as word prefixes. Covers every case form
 * ("ოქტომბერი", "ოქტომბერს", "ოქტომბრის") and the usual abbreviations
 * ("ოქტ.", "ნოემ", "დეკ"). */
const GEORGIAN_MONTH_PREFIXES: Array<[string, number]> = [
  ["იან", 0],
  ["თებ", 1],
  ["მარტ", 2],
  ["აპრ", 3],
  ["მაის", 4],
  ["ივნ", 5],
  ["ივლ", 6],
  ["აგვ", 7],
  ["სექტ", 8],
  ["ოქტ", 9],
  ["ნოემ", 10],
  ["დეკ", 11],
];

const ENGLISH_MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const ROMAN_VALUES: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

/** Parses a roman numeral (e.g. "VIII" -> 8). Returns null if not a valid roman numeral. */
export function romanToInt(input: string): number | null {
  const roman = input.trim().toUpperCase();
  if (!roman || !/^[IVXLCDM]+$/.test(roman)) return null;
  let total = 0;
  for (let i = 0; i < roman.length; i++) {
    const current = ROMAN_VALUES[roman[i]];
    const next = ROMAN_VALUES[roman[i + 1]];
    if (next && current < next) {
      total -= current;
    } else {
      total += current;
    }
  }
  return total > 0 ? total : null;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** UTC epoch ms for a calendar day, or null when the day doesn't exist (31.02). */
function utcDay(year: number, monthIndex: number, day: number): number | null {
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null;
  const ms = Date.UTC(year, monthIndex, day);
  const check = new Date(ms);
  if (check.getUTCMonth() !== monthIndex || check.getUTCDate() !== day) return null;
  return ms;
}

function isoFromUtcMs(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** Matches an already-ISO "YYYY-MM-DD" string. */
export function isIsoDate(text: string | null | undefined): text is string {
  return typeof text === "string" && /^\d{4}-\d{2}-\d{2}$/.test(text.trim());
}

function parseIsoToUtcMs(iso: string): number | null {
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return utcDay(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * The year a year-less date ("12.10", "20 იანვარი") falls in: the semester
 * start's year, or the next one when the month comes before the semester's
 * start month (a September semester's "20.01" is next January).
 */
function inferYear(monthIndex: number, semesterStartDate?: string): number {
  const startMs = semesterStartDate ? parseIsoToUtcMs(semesterStartDate) : null;
  const anchor = startMs !== null ? new Date(startMs) : new Date();
  const startYear = anchor.getUTCFullYear();
  const startMonth = anchor.getUTCMonth();
  return monthIndex < startMonth ? startYear + 1 : startYear;
}

function buildDate(
  day: number,
  monthIndex: number,
  year: number | null,
  semesterStartDate?: string,
): string | null {
  const resolvedYear = year ?? inferYear(monthIndex, semesterStartDate);
  const ms = utcDay(resolvedYear, monthIndex, day);
  return ms === null ? null : isoFromUtcMs(ms);
}

function normalizeYear(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (raw.length === 2) return 2000 + n;
  return n;
}

function georgianMonthIndex(word: string): number | null {
  for (const [prefix, index] of GEORGIAN_MONTH_PREFIXES) {
    if (word.startsWith(prefix)) return index;
  }
  return null;
}

function englishMonthIndex(word: string): number | null {
  const lower = word.toLowerCase().replace(/\.$/, "");
  if (lower.length < 3) return null;
  const index = ENGLISH_MONTHS.findIndex((name) => name.startsWith(lower));
  return index === -1 ? null : index;
}

/** Numeric dates, always day-first: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY, DD.MM, DD/MM, and ISO. */
function parseNumericDate(text: string, semesterStartDate?: string): string | null {
  const iso = text.match(/(?<!\d)(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)/);
  if (iso) {
    return buildDate(Number(iso[3]), Number(iso[2]) - 1, Number(iso[1]), semesterStartDate);
  }

  const withYear = text.match(/(?<![\d.,/-])(\d{1,2})\s*([./-])\s*(\d{1,2})\s*\2\s*(\d{4}|\d{2})(?![\d.,]*\d)/);
  if (withYear) {
    return buildDate(
      Number(withYear[1]),
      Number(withYear[3]) - 1,
      normalizeYear(withYear[4]),
      semesterStartDate,
    );
  }

  // Year-less: only "." and "/" — "1-2" is far more often a range than a date.
  const noYear = text.match(/(?<![\d.,/])(\d{1,2})\s*([./])\s*(\d{1,2})(?![\d/]|\.\d|\s*(?:%|ქულ|points?\b|pts\b))/);
  if (noYear) {
    return buildDate(Number(noYear[1]), Number(noYear[3]) - 1, null, semesterStartDate);
  }

  return null;
}

/**
 * Parses a Georgian-language date: "12 ოქტომბერი", "12 ოქტ.", "15 მაისს 2027",
 * "ოქტომბრის 12", "2026 წლის 12 ოქტომბერი". The year is optional.
 */
export function parseGeorgianDate(text: string, semesterStartDate?: string): string | null {
  const yearFirst = text.match(/(\d{4})\s*წ(?:ლის|\.)?\s*(\d{1,2})\s*(?:-?\s*(?:ს|ე|ში))?\s*([ა-ჰ]+)/u);
  if (yearFirst) {
    const month = georgianMonthIndex(yearFirst[3]);
    if (month !== null) {
      return buildDate(Number(yearFirst[2]), month, Number(yearFirst[1]), semesterStartDate);
    }
  }

  for (const m of text.matchAll(/(?<!\d)(\d{1,2})\s*(?:-?\s*(?:ს|ე|ში)\s+)?([ა-ჰ]+)\.?(?:[\s,]*(\d{4})(?!\d))?/gu)) {
    const month = georgianMonthIndex(m[2]);
    if (month === null) continue;
    return buildDate(Number(m[1]), month, m[3] ? Number(m[3]) : null, semesterStartDate);
  }

  for (const m of text.matchAll(/(?<![ა-ჰ])([ა-ჰ]+)\.?\s+(\d{1,2})(?!\d|\.\d)(?:\s*-?\s*(?:ს|ე|ში))?(?:[\s,]*(\d{4})(?!\d))?/gu)) {
    const month = georgianMonthIndex(m[1]);
    if (month === null) continue;
    return buildDate(Number(m[2]), month, m[3] ? Number(m[3]) : null, semesterStartDate);
  }

  return null;
}

/** "12 October", "12th Oct 2026", "Oct 12", "October 12, 2026". */
function parseEnglishDate(text: string, semesterStartDate?: string): string | null {
  for (const m of text.matchAll(/(?<!\d)(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([A-Za-z]{3,9})\.?(?:,?\s*(\d{4})(?!\d))?/g)) {
    const month = englishMonthIndex(m[2]);
    if (month === null) continue;
    return buildDate(Number(m[1]), month, m[3] ? Number(m[3]) : null, semesterStartDate);
  }
  for (const m of text.matchAll(/(?<![A-Za-z])([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?![\d.])(?:,?\s*(\d{4})(?!\d))?/g)) {
    const month = englishMonthIndex(m[1]);
    if (month === null) continue;
    return buildDate(Number(m[2]), month, m[3] ? Number(m[3]) : null, semesterStartDate);
  }
  return null;
}

/** Parses any explicit calendar date out of a syllabus fragment, or null. */
export function parseAbsoluteDate(
  text: string | null | undefined,
  semesterStartDate?: string,
): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  return (
    parseNumericDate(trimmed, semesterStartDate) ??
    parseGeorgianDate(trimmed, semesterStartDate) ??
    parseEnglishDate(trimmed, semesterStartDate)
  );
}

function toWeekNumber(raw: string): number | null {
  const n = /^\d+$/.test(raw) ? Number(raw) : romanToInt(raw);
  return n && n >= 1 && n <= 52 ? n : null;
}

/**
 * Extracts a week number only when the text actually talks about a week:
 * "მე-7 კვირა", "7-ე კვირა", "1-ლი კვირა", "კვირა VIII", "VII კვირა", "Week 8".
 * In "ქვიზი 3, მე-7 კვირა" that is 7 — never the quiz number.
 */
export function extractWeekNumber(text: string | undefined | null): number | null {
  if (!text) return null;
  const patterns = [
    /მე\s*-?\s*(\d{1,2})\s*-?\s*(?:ე\s*)?კვირ/u,
    /(?<![\d.])(\d{1,2})\s*-?\s*(?:ე|ლი)?\s*კვირ/u,
    /(?<![A-Za-z])([IVXLC]{1,6})\s*-?\s*(?:ე\s*)?კვირ/u,
    /კვირ[ა-ჰ]*\s*[:#№-]?\s*(\d{1,2}|[IVXLC]{1,6})(?![\dA-Za-z])/u,
    /week\s*[:#№-]?\s*(\d{1,2}|[IVXLC]{1,6})(?![\dA-Za-z])/i,
    /(?<![\d.])(\d{1,2})(?:st|nd|rd|th)\s+week/i,
  ];
  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (!m) continue;
    const n = toWeekNumber(m[1].toUpperCase());
    if (n) return n;
  }
  return null;
}

/**
 * Reads the model's dedicated `week` field. Unlike free text it may be a
 * bare "7", "VII" or "მე-7", so those are accepted too — but a range like
 * "7-8" still resolves to the first week only when nothing better exists.
 */
export function parseWeekField(week: string | null | undefined): number | null {
  if (!week) return null;
  const keyword = extractWeekNumber(week);
  if (keyword) return keyword;
  const bare = week.trim().match(/^(?:მე\s*-?\s*)?(\d{1,2}|[IVXLC]{1,6})(?:\s*-?\s*(?:ე|ლი))?(?:\s*[-–]\s*\d{1,2})?\.?$/iu);
  return bare ? toWeekNumber(bare[1].toUpperCase()) : null;
}

/** Georgian weekday stems, matched anywhere in free text, Monday = 0. Sunday
 * ("კვირა") is deliberately absent here: it's the same word as "week". */
const GEORGIAN_WEEKDAYS_IN_TEXT: Array<[RegExp, number]> = [
  [/ორშაბათ/u, 0],
  [/სამშაბათ/u, 1],
  [/ოთხშაბათ/u, 2],
  [/ხუთშაბათ/u, 3],
  [/პარასკევ/u, 4],
  [/(?<![ა-ჰ])შაბათ/u, 5],
];

const ENGLISH_WEEKDAYS: Array<[RegExp, number]> = [
  [/\bmon(?:day)?\b/i, 0],
  [/\btue(?:s|sday)?\b/i, 1],
  [/\bwed(?:nesday)?\b/i, 2],
  [/\bthu(?:r|rs|rsday)?\b/i, 3],
  [/\bfri(?:day)?\b/i, 4],
  [/\bsat(?:urday)?\b/i, 5],
  [/\bsun(?:day)?\b/i, 6],
];

/** A weekday named in free text (all Georgian case forms), Monday = 0. */
export function extractWeekdayOffset(text: string | null | undefined): number | null {
  if (!text) return null;
  for (const [pattern, offset] of GEORGIAN_WEEKDAYS_IN_TEXT) {
    if (pattern.test(text)) return offset;
  }
  for (const [pattern, offset] of ENGLISH_WEEKDAYS) {
    if (pattern.test(text)) return offset;
  }
  return null;
}

/** The model's dedicated `weekday` field — here a bare "კვირა" does mean Sunday. */
export function parseWeekdayField(weekday: string | null | undefined): number | null {
  if (!weekday) return null;
  const trimmed = weekday.trim();
  if (/^კვირ(?:ა|ას|ის)?\.?$/u.test(trimmed)) return 6;
  const fromText = extractWeekdayOffset(trimmed);
  if (fromText !== null) return fromText;
  const short: Array<[RegExp, number]> = [
    [/^ორშ/u, 0],
    [/^სამ/u, 1],
    [/^ოთხ/u, 2],
    [/^ხუთ/u, 3],
    [/^პარ/u, 4],
    [/^შაბ/u, 5],
  ];
  for (const [pattern, offset] of short) {
    if (pattern.test(trimmed)) return offset;
  }
  return null;
}

/** Monday of the week containing `semesterStartDate` (UTC ms), or null. */
function semesterWeekOneMonday(semesterStartDate: string | undefined): number | null {
  if (!semesterStartDate) return null;
  const startMs = parseIsoToUtcMs(semesterStartDate);
  if (startMs === null) return null;
  const mondayOffset = (new Date(startMs).getUTCDay() + 6) % 7;
  return startMs - mondayOffset * DAY_MS;
}

/** Week N of the semester (Monday-based), plus an optional weekday offset. */
export function dateFromSemesterWeek(
  semesterStartDate: string | undefined,
  weekNumber: number,
  weekdayOffset: number | null = null,
): string | null {
  const monday = semesterWeekOneMonday(semesterStartDate);
  if (monday === null) return null;
  return isoFromUtcMs(monday + ((weekNumber - 1) * 7 + (weekdayOffset ?? 0)) * DAY_MS);
}

export interface ResolveMilestoneDateInput {
  /** The exact "when" fragment from the syllabus, e.g. "12.10" or "მე-7 კვირა, ხუთშაბათი". */
  rawDateText?: string | null;
  /** The week-of-semester the model read, e.g. "7" or "VII". */
  week?: string | null;
  /** The weekday the model read, e.g. "ხუთშაბათი". */
  weekday?: string | null;
  /** The semester's start date (ISO), supplied by the user on the syllabus form. */
  semesterStartDate?: string;
}

export interface ResolvedMilestoneDate {
  date: string | null;
  dateStatus: MilestoneDateStatus;
  weekNumber: number | null;
}

/**
 * Resolves a milestone's calendar date:
 * 1. An explicit date in `rawDateText` → "exact".
 * 2. A week number (the `week` field, or a real week phrase in
 *    `rawDateText`) → Monday of the semester's first week + (N-1)×7, plus
 *    the stated weekday if any → "computed-from-week".
 * 3. Otherwise → `null`, "unknown". Never a made-up date.
 */
export function resolveMilestoneDate({
  rawDateText,
  week,
  weekday,
  semesterStartDate,
}: ResolveMilestoneDateInput): ResolvedMilestoneDate {
  const weekNumber = parseWeekField(week) ?? extractWeekNumber(rawDateText);

  const exact = parseAbsoluteDate(rawDateText, semesterStartDate);
  if (exact) return { date: exact, dateStatus: "exact", weekNumber };

  if (weekNumber) {
    const weekdayOffset = parseWeekdayField(weekday) ?? extractWeekdayOffset(rawDateText);
    const computed = dateFromSemesterWeek(semesterStartDate, weekNumber, weekdayOffset);
    if (computed) return { date: computed, dateStatus: "computed-from-week", weekNumber };
  }

  return { date: null, dateStatus: "unknown", weekNumber };
}
