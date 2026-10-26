/**
 * Syllabus dates as one tidy list for a subject: real dates and „მე-N
 * კვირა“ turned into one format, only what's still ahead, nearest first.
 * Also which subject a syllabus belongs to. Pure, so it's testable apart
 * from storage (`syllabus-calendar.ts`).
 */
import type { SyllabusMilestone, SyllabusMilestoneType } from "@/lib/syllabus-calendar";

const MONTHS_SHORT = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
const MONTHS = [
  "იანვარი",
  "თებერვალი",
  "მარტი",
  "აპრილი",
  "მაისი",
  "ივნისი",
  "ივლისი",
  "აგვისტო",
  "სექტემბერი",
  "ოქტომბერი",
  "ნოემბერი",
  "დეკემბერი",
];
const DAY_MS = 86_400_000;

export interface SyllabusDate {
  id: string;
  title: string;
  type: SyllabusMilestoneType;
  /** YYYY-MM-DD, when known. */
  date: string | null;
  /** The week of the semester, when only that is known. */
  week: number | null;
  /** „16 ნოე“ or „მე-4 კვ.“ */
  label: string;
  topic: string | null;
  /** Share of the final grade, in percent. */
  weight: number | null;
}

const isIso = (value: string | null | undefined): value is string => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
const toUtc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** „16 ნოე“ */
export function shortDateLabel(iso: string): string {
  const [, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS_SHORT[month - 1]}`;
}

/** „ნოემბერი 2026“ */
export function monthLabel(iso: string): string {
  const [year, month] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${year}`;
}

const ROMAN: Record<string, number> = { i: 1, v: 5, x: 10, l: 50 };

/** „7“, „VII“, „მე-18/მე-19“, „18–19“ → the first week number. */
export function parseWeek(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const digits = raw.match(/\d+/);
  if (digits) return Number(digits[0]) || null;
  const roman = raw.trim().toLowerCase().match(/^[ivxl]+/);
  if (!roman) return null;
  let total = 0;
  const letters = roman[0].split("").map((letter) => ROMAN[letter]);
  letters.forEach((value, index) => {
    total += value < (letters[index + 1] ?? 0) ? -value : value;
  });
  return total || null;
}

/** The Monday of week N, counting the week the semester starts in as week 1. */
export function weekToDate(week: number, semesterStart: string): string {
  const start = toUtc(semesterStart);
  const weekday = (new Date(start).getUTCDay() + 6) % 7; // Monday = 0
  return fromUtc(start - weekday * DAY_MS + (week - 1) * 7 * DAY_MS);
}

/** One milestone in the common format. */
export function normalizeSyllabusDate(milestone: SyllabusMilestone, semesterStart?: string | null): SyllabusDate {
  const week = parseWeek(milestone.week);
  const start = semesterStart ?? milestone.semesterStart;
  const date = isIso(milestone.date) ? milestone.date : week && isIso(start) ? weekToDate(week, start) : null;
  return {
    id: milestone.id,
    title: milestone.title,
    type: milestone.type,
    date,
    week: date ? null : week,
    label: date ? shortDateLabel(date) : week ? `მე-${week} კვ.` : "თარიღი უცნობია",
    topic: milestone.topic?.trim() || null,
    weight: typeof milestone.weight === "number" ? milestone.weight : null,
  };
}

export interface SyllabusDateList {
  /** From today on, nearest first. */
  upcoming: SyllabusDate[];
  /** Before today, latest first. */
  past: SyllabusDate[];
  /** Only a week, or nothing, to go by. */
  undated: SyllabusDate[];
}

export function sortSyllabusDates(items: SyllabusDate[], today: string): SyllabusDateList {
  const dated = items.filter((item) => item.date);
  return {
    upcoming: dated.filter((item) => item.date! >= today).sort((a, b) => a.date!.localeCompare(b.date!)),
    past: dated.filter((item) => item.date! < today).sort((a, b) => b.date!.localeCompare(a.date!)),
    undated: items.filter((item) => !item.date).sort((a, b) => (a.week ?? 99) - (b.week ?? 99)),
  };
}

/** Whole days from `today` to `date`. */
export function daysFrom(today: string, date: string): number {
  return Math.round((toUtc(date) - toUtc(today)) / DAY_MS);
}

/** Upcoming dates by month, for the full list. */
export function groupByMonth(items: SyllabusDate[]): { month: string; items: SyllabusDate[] }[] {
  const groups: { month: string; items: SyllabusDate[] }[] = [];
  for (const item of items) {
    if (!item.date) continue;
    const month = monthLabel(item.date);
    const group = groups.find((entry) => entry.month === month);
    if (group) group.items.push(item);
    else groups.push({ month, items: [item] });
  }
  return groups;
}

/** The syllabus's topics, in order, once each — to fill the plan's topics. */
export function syllabusTopics(milestones: SyllabusMilestone[]): string[] {
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const milestone of milestones) {
    const topic = milestone.topic?.replace(/\s+/g, " ").trim();
    if (!topic || seen.has(topic.toLowerCase())) continue;
    seen.add(topic.toLowerCase());
    topics.push(topic);
  }
  return topics;
}

/* --- Which subject a syllabus belongs to -------------------------------- */

const simplify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[„“"'«»().,:;\-–—_/\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * The semester subject a syllabus's course name refers to: the same name,
 * or one inside the other („მიკროეკონომიკა I“ ↔ „მიკროეკონომიკა“). Null
 * when none matches (the student picks one).
 */
export function matchSemesterSubject(courseName: string | null | undefined, subjects: string[]): string | null {
  if (!courseName?.trim()) return null;
  const course = simplify(courseName);
  const exact = subjects.find((subject) => simplify(subject) === course);
  if (exact) return exact;
  const contained = subjects
    .filter((subject) => {
      const name = simplify(subject);
      return name.length >= 4 && (course.includes(name) || name.includes(course));
    })
    .sort((a, b) => b.length - a.length);
  return contained[0] ?? null;
}

/** A subject's syllabus milestones. Unbound ones (saved before subjects) belong to none. */
export function milestonesForSubject(milestones: SyllabusMilestone[], subject: string): SyllabusMilestone[] {
  const name = simplify(subject);
  return name ? milestones.filter((milestone) => milestone.subject && simplify(milestone.subject) === name) : [];
}

export function unboundMilestones(milestones: SyllabusMilestone[]): SyllabusMilestone[] {
  return milestones.filter((milestone) => !milestone.subject);
}

/** A new analysis replaces the same subject's milestones (or the unbound ones); others stay. */
export function replaceSubjectMilestones(
  stored: SyllabusMilestone[],
  subject: string | null,
  next: SyllabusMilestone[],
): SyllabusMilestone[] {
  const same = (milestone: SyllabusMilestone) =>
    subject ? !!milestone.subject && simplify(milestone.subject) === simplify(subject) : !milestone.subject;
  const tagged = next.map((milestone) => ({ ...milestone, subject: subject ?? undefined }));
  return [...stored.filter((milestone) => !same(milestone)), ...tagged];
}

/** The analysis on screen moved to another subject: its milestones (by id) follow. */
export function retagMilestones(stored: SyllabusMilestone[], ids: Set<string>, subject: string | null): SyllabusMilestone[] {
  return stored.map((milestone) => (ids.has(milestone.id) ? { ...milestone, subject: subject ?? undefined } : milestone));
}

/** „მიაბი საგანს“: the unbound milestones now belong to `subject`. */
export function bindUnbound(stored: SyllabusMilestone[], subject: string): SyllabusMilestone[] {
  return stored.map((milestone) => (milestone.subject ? milestone : { ...milestone, subject }));
}

/* --- The analyzer's views ----------------------------------------------- */

export interface SyllabusCounts {
  total: number;
  exams: number;
  quizzes: number;
  deadlines: number;
}

export function syllabusCounts(items: { type: SyllabusMilestoneType }[]): SyllabusCounts {
  return {
    total: items.length,
    exams: items.filter((item) => item.type === "midterm" || item.type === "final").length,
    quizzes: items.filter((item) => item.type === "quiz").length,
    deadlines: items.filter((item) => item.type === "deadline").length,
  };
}

export interface WeekPlanRow {
  week: number;
  /** The week's Monday, when the semester start is known. */
  monday: string | null;
  items: { id: string; title: string; topic: string | null; type: SyllabusMilestoneType }[];
}

/** Week 1…N: what the syllabus puts in each week (by its week, or its date counted from the start). */
export function weekPlan(milestones: SyllabusMilestone[], semesterStart?: string | null): WeekPlanRow[] {
  const rows = new Map<number, WeekPlanRow>();
  for (const milestone of milestones) {
    const start = semesterStart ?? milestone.semesterStart ?? null;
    let week = parseWeek(milestone.week);
    if (!week && isIso(milestone.date) && isIso(start)) {
      week = Math.floor((toUtc(milestone.date) - toUtc(weekToDate(1, start))) / (7 * DAY_MS)) + 1;
    }
    if (!week || week < 1) continue;
    const row = rows.get(week) ?? { week, monday: isIso(start) ? weekToDate(week, start) : null, items: [] };
    row.items.push({ id: milestone.id, title: milestone.title, topic: milestone.topic?.trim() || null, type: milestone.type });
    rows.set(week, row);
  }
  return [...rows.values()].sort((a, b) => a.week - b.week);
}

export interface SavedSyllabus {
  /** null: saved before subjects, not bound yet. */
  subject: string | null;
  count: number;
  next: SyllabusDate | null;
}

/** „შენი სილაბუსები“: one row per subject, with its nearest date ahead. */
export function savedSyllabi(milestones: SyllabusMilestone[], today: string): SavedSyllabus[] {
  const bySubject = new Map<string | null, SyllabusMilestone[]>();
  for (const milestone of milestones) {
    const key = milestone.subject?.trim() || null;
    bySubject.set(key, [...(bySubject.get(key) ?? []), milestone]);
  }
  return [...bySubject.entries()]
    .map(([subject, items]) => ({
      subject,
      count: items.length,
      next: sortSyllabusDates(items.map((item) => normalizeSyllabusDate(item)), today).upcoming[0] ?? null,
    }))
    .sort((a, b) => (a.subject === null ? 1 : b.subject === null ? -1 : a.subject.localeCompare(b.subject, "ka")));
}

/** „15 სექ 2026 — 25 იან 2027“: from the semester start to the last date. */
export function semesterRangeLabel(milestones: SyllabusMilestone[]): string | null {
  const start = milestones.map((item) => item.semesterStart).find(isIso);
  const last = milestones
    .map((item) => normalizeSyllabusDate(item).date)
    .filter(isIso)
    .sort()
    .pop();
  if (!start && !last) return null;
  const label = (iso: string) => `${shortDateLabel(iso)} ${iso.slice(0, 4)}`;
  return [start ? label(start) : "?", last ? label(last) : "?"].join(" — ");
}
