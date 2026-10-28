import { describe, expect, it } from "vitest";
import { buildDiary, diaryDayLabel } from "./diary";
import type { ToolUsageEvent } from "./activity";

const NOW = new Date(2026, 9, 28, 18, 0);
const at = (day: number, hour: number) => new Date(2026, 9, day, hour, 0).getTime();
const ev = (id: string, toolId: string, timestamp: number, subject: string | null = null): ToolUsageEvent => ({
  id,
  toolId,
  toolTitle: toolId,
  subject,
  timestamp,
});

describe("diaryDayLabel", () => {
  it("names today, yesterday and older days by date", () => {
    expect(diaryDayLabel(at(28, 9), NOW)).toBe("დღეს");
    expect(diaryDayLabel(at(27, 23), NOW)).toBe("გუშინ");
    expect(diaryDayLabel(at(24, 12), NOW)).toBe("24 ოქტომბერი");
  });
});

describe("buildDiary", () => {
  it("merges the same tool on the same subject and day into one line", () => {
    const days = buildDiary(
      [ev("a", "ai-teacher", at(28, 10)), ev("b", "ai-teacher", at(28, 12)), ev("c", "quiz", at(28, 11))],
      8,
      NOW,
    );
    expect(days).toHaveLength(1);
    expect(days[0].entries.map((e) => [e.toolId, e.count])).toEqual([
      ["ai-teacher", 2],
      ["quiz", 1],
    ]);
  });

  it("keeps different subjects and different days apart, newest day first", () => {
    const days = buildDiary(
      [ev("a", "quiz", at(27, 10), "ალგებრა"), ev("b", "quiz", at(28, 9), "ალგებრა"), ev("c", "quiz", at(28, 10), "ისტორია")],
      8,
      NOW,
    );
    expect(days.map((d) => d.label)).toEqual(["დღეს", "გუშინ"]);
    expect(days[0].entries).toHaveLength(2);
  });

  it("stops at the limit", () => {
    const events = Array.from({ length: 12 }, (_, i) => ev(String(i), `tool-${i}`, at(28, 1) + i));
    expect(buildDiary(events, 5, NOW).flatMap((d) => d.entries)).toHaveLength(5);
  });
});
