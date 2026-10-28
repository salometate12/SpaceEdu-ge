/**
 * The dashboard's study-calendar card as pure helpers: Georgian dates for a
 * plan day, which days the card shows, and the first message the AI teacher
 * gets for „დაიწყე სწავლა“.
 */
import type { StudyPlanCalendarDay } from "@/lib/study-plan-calendar";

const WEEKDAY_SHORT = ["კვი", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"];
const WEEKDAY_LONG = ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"];
const MONTH_SHORT = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
const MONTH_LONG = [
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

/** YYYY-MM-DD as a calendar date, independent of the time zone. */
function parts(iso: string): { weekday: number; day: number; month: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay(), day: d, month: m - 1 };
}

/** „ხუთ, 29 ოქტ.“ */
export function shortDayLabel(iso: string): string {
  const { weekday, day, month } = parts(iso);
  return `${WEEKDAY_SHORT[weekday]}, ${day} ${MONTH_SHORT[month]}.`;
}

/** „პარასკევი, 30 ოქტომბერი“ */
export function longDayLabel(iso: string): string {
  const { weekday, day, month } = parts(iso);
  return `${WEEKDAY_LONG[weekday]}, ${day} ${MONTH_LONG[month]}`;
}

/** For the phone's date column: „ხუთ“ and „29“. */
export function dayColumn(iso: string): { weekday: string; day: number } {
  const { weekday, day } = parts(iso);
  return { weekday: WEEKDAY_SHORT[weekday], day };
}

/** The day's title: its topics. */
export function studyDayTitle(day: Pick<StudyPlanCalendarDay, "topics">): string {
  return day.topics.map((topic) => topic.trim()).filter(Boolean).join(", ");
}

/** How many days the card shows before „ყველა დღე (N)“: 8 on wider screens, 4 on phones. */
export function visibleStudyDays<T>(days: T[], showAll: boolean, limit: number): T[] {
  return showAll ? days : days.slice(0, limit);
}

/** The first message the AI teacher gets for a study day. */
export function studyDayPrompt(subject: string, day: Pick<StudyPlanCalendarDay, "topics" | "tasks">): string {
  const lines = [`დღეს ვსწავლობ „${subject.trim()}“-ს. დღის თემა: ${studyDayTitle(day)}.`];
  const subtopics = (day.tasks ?? []).map((task) => task.trim()).filter(Boolean);
  if (subtopics.length > 0) lines.push(`ქვეთემები: ${subtopics.join("; ")}`);
  lines.push("ამიხსენი ეს თემა მარტივად, ნაბიჯ ნაბიჯ, მაგალითებით. ბოლოს 3 მოკლე კითხვით შემამოწმე.");
  return lines.join("\n");
}
