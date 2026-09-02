/**
 * Turning whatever "when" text the AI extracts from a syllabus PDF into a
 * real, placeable YYYY-MM-DD calendar date.
 *
 * Syllabi almost never state actual calendar dates — they say "Week 8:
 * Midterm". An AI asked for a "date" will often just echo that week
 * label back (e.g. "კვირა VIII"), which the dashboard calendar can't
 * place on any grid cell (JS `Date` can't parse it, so the event
 * silently never appears anywhere). This module tries several parsing
 * strategies, falling back to computing a date from the semester's
 * start date + the milestone's week number when nothing else works.
 */

const GEORGIAN_MONTHS: Record<string, number> = {
  იანვ: 0,
  თებერვ: 1,
  მარტ: 2,
  აპრილ: 3,
  მაისი: 4,
  ივნის: 5,
  ივლის: 6,
  აგვისტ: 7,
  სექტემბერ: 8,
  ოქტომბერ: 9,
  ნოემბერ: 10,
  დეკემბერ: 11,
};

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

function toIsoDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Matches an already-ISO "YYYY-MM-DD" string. */
function isIsoDate(text: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(text.trim());
}

/** Tries to parse a Georgian-language date like "15 ოქტომბერი, 2026" or "15 ოქტომბერს 2026 წელი". */
export function parseGeorgianDate(text: string): Date | null {
  const match = text.match(/(\d{1,2})\s*([ა-ჰ]+)\D{0,6}(\d{4})/u);
  if (!match) return null;
  const [, dayStr, monthWordRaw, yearStr] = match;
  const day = parseInt(dayStr, 10);
  const year = parseInt(yearStr, 10);
  const monthKey = Object.keys(GEORGIAN_MONTHS).find((stem) => monthWordRaw.startsWith(stem));
  if (!monthKey || day < 1 || day > 31) return null;
  const date = new Date(year, GEORGIAN_MONTHS[monthKey], day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Extracts a week number from text like "კვირა VIII", "8-ე კვირა", or "Week 8". */
export function extractWeekNumber(text: string | undefined | null): number | null {
  if (!text) return null;
  const arabicMatch = text.match(/(\d{1,2})/);
  if (arabicMatch) {
    const n = parseInt(arabicMatch[1], 10);
    if (n >= 1 && n <= 52) return n;
  }
  const romanMatch = text.match(/\b[IVXLCDM]{1,6}\b/);
  if (romanMatch) {
    const n = romanToInt(romanMatch[0]);
    if (n && n >= 1 && n <= 52) return n;
  }
  return null;
}

/** Parses any recognizable absolute date out of free text — ISO, native-Date-parseable, or Georgian. */
function parseAbsoluteDate(text: string): Date | null {
  const trimmed = text.trim();
  if (isIsoDate(trimmed)) return new Date(`${trimmed}T00:00:00`);
  const georgian = parseGeorgianDate(trimmed);
  if (georgian) return georgian;
  const native = new Date(trimmed);
  if (!Number.isNaN(native.getTime()) && trimmed.length > 4) return native;
  return null;
}

interface ResolveMilestoneDateInput {
  /** The "date" field as returned by the AI — may already be ISO, a formatted date, or a week label. */
  rawDate: string;
  /** The "week" field as returned by the AI, if any. */
  week?: string;
  /** The semester's start date (ISO), supplied by the user on the syllabus form. */
  semesterStartDate?: string;
  /** Used as a last-resort ordering fallback so events never collide on the same day. */
  fallbackIndex: number;
}

/**
 * Resolves a milestone's real calendar date, trying in order:
 * 1. An absolute date already present in `rawDate` (ISO, native, or Georgian).
 * 2. A week number (from `week` or embedded in `rawDate`) computed against
 *    `semesterStartDate` (Monday of that week).
 * 3. `semesterStartDate` itself, offset by `fallbackIndex` weeks, so
 *    multiple undated milestones still land on distinct, valid days
 *    instead of silently vanishing from the calendar.
 */
export function resolveMilestoneIsoDate({
  rawDate,
  week,
  semesterStartDate,
  fallbackIndex,
}: ResolveMilestoneDateInput): string {
  const absolute = parseAbsoluteDate(rawDate);
  if (absolute) return toIsoDateKey(absolute);

  const weekNumber = extractWeekNumber(week) ?? extractWeekNumber(rawDate);
  const start = semesterStartDate && isIsoDate(semesterStartDate) ? new Date(`${semesterStartDate}T00:00:00`) : null;

  if (start && weekNumber) {
    const computed = new Date(start);
    computed.setDate(computed.getDate() + (weekNumber - 1) * 7);
    return toIsoDateKey(computed);
  }

  if (start) {
    const computed = new Date(start);
    computed.setDate(computed.getDate() + fallbackIndex * 7);
    return toIsoDateKey(computed);
  }

  // No semester start date available at all — nothing left to anchor to.
  return toIsoDateKey(new Date());
}
