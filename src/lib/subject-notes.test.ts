import { describe, expect, it } from "vitest";
import { blankNote, firstLine, hasContent, newNoteHref, noteHref, shortNoteDate, sortNotes, subjectHref } from "./subject-notes";

describe("subject notes", () => {
  it("addresses: a note, a new one in a topic, the subject with the topic open, „საგნის გარეშე“", () => {
    expect(noteHref({ id: "n1", subjectId: "s1" })).toBe("/subjects/s1/notes/n1");
    expect(noteHref({ id: "n1", subjectId: null })).toBe("/subjects/none/notes/n1");
    expect(newNoteHref("s1", "t2")).toBe("/subjects/s1/notes/new?topic=t2");
    expect(subjectHref("s1", "t2")).toBe("/subjects/s1?topic=t2");
    expect(subjectHref(null)).toBe("/subjects/none");
  });

  it("the list's date and first line", () => {
    expect(shortNoteDate("2026-10-22")).toBe("22 ოქტ.");
    expect(firstLine("\n## **DNS** lookup\nმეორე")).toBe("DNS lookup");
    expect(firstLine("  ")).toBe("");
  });

  it("an untouched new note has nothing in it; newest lecture first", () => {
    const blank = blankNote("s1", "t1", "2026-10-22", 1);
    expect(hasContent(blank)).toBe(false);
    expect(blank.topicId).toBe("t1");
    const older = { ...blank, id: "a", lectureDate: "2026-10-01", title: "x" };
    const newer = { ...blank, id: "b", lectureDate: "2026-10-20" };
    expect(sortNotes([older, newer]).map((note) => note.id)).toEqual(["b", "a"]);
  });
});
