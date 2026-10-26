import { describe, expect, it } from "vitest";
import { buildIcs } from "./ics";

describe("ics", () => {
  const ics = buildIcs(
    [
      { id: "q1", title: "ქვიზი 1, თავი 2; ფორმულები", date: "2026-10-26", description: "მე-6 კვირა" },
      { id: "x", title: "უთარიღო", date: "" },
    ],
    { name: "მიკროეკონომიკა" },
  );

  it("is a calendar of all-day events with CRLF line endings", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261026\r\n");
    expect(ics).toContain("DTEND;VALUE=DATE:20261027\r\n");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });

  it("escapes commas and semicolons and skips undated events", () => {
    expect(ics).toContain("SUMMARY:ქვიზი 1\\, თავი 2\; ფორმულები");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });

  it("folds long lines at 75 octets", () => {
    const long = buildIcs([{ id: "l", title: "ა".repeat(60), date: "2026-11-02" }]);
    for (const line of long.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(long).toContain("\r\n ");
  });
});
