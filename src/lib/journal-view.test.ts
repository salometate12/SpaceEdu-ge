import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBlankLectureNote, type LectureNote } from "./lecture-notes";
import { createAutosave, enoughForAi, filterNotes, formatJournalDate, groupNotesByDay, noteText } from "./journal-view";

const now = new Date(2026, 9, 22, 15, 0).getTime();
const note = (id: string, patch: Partial<LectureNote>): LectureNote => ({
  ...createBlankLectureNote("lectures"),
  id,
  title: "ჩანაწერი",
  ...patch,
});

describe("Georgian date line", () => {
  it("„15 ოქტომბერი 2026 · ხუთშაბათი“", () => {
    expect(formatJournalDate("2026-10-15")).toBe("15 ოქტომბერი 2026 · ხუთშაბათი");
    expect(formatJournalDate("2026-10-19")).toBe("19 ოქტომბერი 2026 · ორშაბათი");
  });
});

describe("list grouping", () => {
  it("pinned first, then today, yesterday, this week, earlier — newest first", () => {
    const groups = groupNotesByDay(
      [
        note("old", { updatedAt: now - 30 * 86_400_000 }),
        note("today", { updatedAt: now - 3_600_000 }),
        note("pinned", { pinned: true, updatedAt: now - 10 * 86_400_000 }),
        note("yesterday", { updatedAt: new Date(2026, 9, 21, 22, 0).getTime() }),
        note("week", { updatedAt: new Date(2026, 9, 18, 9, 0).getTime() }),
      ],
      now,
    );
    expect(groups.map((group) => [group.label, group.notes.map((n) => n.id)])).toEqual([
      ["დამაგრებული", ["pinned"]],
      ["დღეს", ["today"]],
      ["გუშინ", ["yesterday"]],
      ["ამ კვირაში", ["week"]],
      ["ადრე", ["old"]],
    ]);
  });
});

describe("search and categories", () => {
  const notes = [
    note("a", { title: "ელასტიურობა", content: "მოთხოვნა და მიწოდება", section: "lectures" }),
    note("b", { title: "დავალება #3", content: "რეგრესია, ვადა პარასკევი", section: "assignments", subject: "სტატისტიკა" }),
    note("blank", { title: "", content: "" }),
  ];
  it("by title or text, any case; within a category; empty entries never listed", () => {
    expect(filterNotes(notes, { category: "all", query: "" }).map((n) => n.id)).toEqual(["a", "b"]);
    expect(filterNotes(notes, { category: "all", query: "რეგრესია" }).map((n) => n.id)).toEqual(["b"]);
    expect(filterNotes(notes, { category: "all", query: "სტატისტიკა" }).map((n) => n.id)).toEqual(["b"]);
    expect(filterNotes(notes, { category: "lectures", query: "" }).map((n) => n.id)).toEqual(["a"]);
    expect(filterNotes(notes, { category: "ideas", query: "" })).toEqual([]);
  });

  it("an older two-page note reads as one text", () => {
    expect(noteText({ content: "მარცხენა", contentRight: "მარჯვენა" })).toBe("მარცხენა\n\nმარჯვენა");
  });

  it("the AI tools need at least 50 characters", () => {
    expect(enoughForAi("მოკლე")).toBe(false);
    expect(enoughForAi("ა".repeat(50))).toBe(true);
  });
});

describe("autosave", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("saves ~800ms after the last change, once; shows „ინახება…“ then „შენახულია“", () => {
    const save = vi.fn();
    const statuses: string[] = [];
    const autosave = createAutosave<string>(save, (status) => statuses.push(status));
    autosave.schedule("ა");
    vi.advanceTimersByTime(500);
    autosave.schedule("აბ");
    vi.advanceTimersByTime(700);
    expect(save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(150);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("აბ");
    expect(statuses.at(-1)).toBe("saved");
    expect(statuses).toContain("saving");
  });

  it("leaving the page saves what's pending at once", () => {
    const save = vi.fn();
    const autosave = createAutosave<string>(save, () => {});
    autosave.schedule("ტექსტი");
    autosave.flush();
    expect(save).toHaveBeenCalledWith("ტექსტი");
    autosave.flush();
    expect(save).toHaveBeenCalledTimes(1);
  });
});
