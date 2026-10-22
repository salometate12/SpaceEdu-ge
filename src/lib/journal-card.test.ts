import { describe, expect, it } from "vitest";
import { isWideToolCard } from "./dashboard-grid";
import { JOURNAL_CATEGORIES, journalCategory } from "./journal-categories";
import { awardJournalSave, JOURNAL_SECTION_IDS } from "./lecture-notes";
import { relativeTimeShortKa } from "./relative-time-ka";

describe("relative time, short, in Georgian", () => {
  const now = new Date(2026, 9, 22, 15, 0).getTime();
  it("minutes and hours today, then yesterday, days, a date", () => {
    expect(relativeTimeShortKa(now - 20_000, now)).toBe("ახლა");
    expect(relativeTimeShortKa(now - 5 * 60_000, now)).toBe("5 წთ");
    expect(relativeTimeShortKa(now - 2 * 3_600_000, now)).toBe("2 სთ");
    expect(relativeTimeShortKa(new Date(2026, 9, 21, 23, 30).getTime(), now)).toBe("გუშინ");
    expect(relativeTimeShortKa(new Date(2026, 9, 19, 9, 0).getTime(), now)).toBe("3 დღე");
    expect(relativeTimeShortKa(new Date(2026, 8, 15, 9, 0).getTime(), now)).toBe("15 სექ");
  });
});

describe("journal categories", () => {
  it("one entry per kind of note, with the agreed colours", () => {
    expect(JOURNAL_CATEGORIES.map((category) => category.id)).toEqual([...JOURNAL_SECTION_IDS]);
    expect(Object.fromEntries(JOURNAL_CATEGORIES.map((category) => [category.id, category.color]))).toEqual({
      lectures: "#ec4899",
      assignments: "#38bdf8",
      "ai-notes": "#eab308",
      ideas: "#14b8a6",
    });
    expect(journalCategory("ai-notes").colorDark).toBe("#a16207");
  });
});

describe("tools grid on a phone", () => {
  it("a last card that would stand alone takes the full width", () => {
    // 8 tools: wide, half, half, wide, half, half, wide, [half alone → wide]
    expect([...Array(8).keys()].map((index) => isWideToolCard(index, 8))).toEqual([true, false, false, true, false, false, true, true]);
    // 9 tools: the last pair stays side by side.
    expect([...Array(9).keys()].map((index) => isWideToolCard(index, 9)).slice(-2)).toEqual([false, false]);
  });
});

describe("journal XP", () => {
  it("still counts on every save (shown on the profile, not on the card)", () => {
    const { progress, xpGained } = awardJournalSave({ xp: 100, streak: 0, lastSaveDate: null, unlocked: {} });
    expect(xpGained).toBeGreaterThan(0);
    expect(progress.xp).toBe(100 + xpGained);
  });
});
