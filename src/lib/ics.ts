/**
 * An iCalendar (.ics) file of all-day events, for Google / Apple / Outlook
 * calendars. Pure, so it's testable; `downloadIcs` saves it in the browser.
 */

export interface IcsEvent {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  description?: string;
}

/** Commas, semicolons, backslashes and new lines escaped (RFC 5545). */
function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Lines longer than 75 octets are folded onto continuation lines. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  for (const char of line) {
    if (new TextEncoder().encode(current + char).length > (parts.length === 0 ? 75 : 74)) {
      parts.push(current);
      current = "";
    }
    current += char;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

const compact = (iso: string) => iso.replace(/-/g, "");

/** The day after (DTEND of an all-day event is exclusive). */
function nextDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

export function buildIcs(events: IcsEvent[], { name = "SpaceEdu", stamp = "20260101T000000Z" }: { name?: string; stamp?: string } = {}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SpaceEdu//Syllabus//KA",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(name)}`,
    ...events
      .filter((event) => /^\d{4}-\d{2}-\d{2}$/.test(event.date))
      .flatMap((event) => [
        "BEGIN:VEVENT",
        `UID:${event.id}@spaceedu.ge`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${compact(event.date)}`,
        `DTEND;VALUE=DATE:${compact(nextDay(event.date))}`,
        `SUMMARY:${escapeText(event.title)}`,
        ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
        "END:VEVENT",
      ]),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Saves the calendar as a file. */
export function downloadIcs(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}
