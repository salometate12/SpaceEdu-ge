import { describe, expect, it } from "vitest";
import {
  appendAsk,
  ASK_HISTORY_LIMIT,
  askPayload,
  askSuggestions,
  blankNote,
  cleanKeywords,
  firstLine,
  hasContent,
  insertAnswer,
  keywordsHash,
  needsKeywords,
  newNoteHref,
  noteAsSource,
  noteHref,
  noteToolHref,
  shortNoteDate,
  sortNotes,
  subjectHref,
} from "./subject-notes";

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

  it("key topics: only from 300 characters, and not again for the same text", () => {
    const note = { ...blankNote("s1", undefined, "2026-10-22", 1), title: "DNS", body: "ა".repeat(299) };
    expect(needsKeywords(note)).toBe(false);
    const long = { ...note, body: "ა".repeat(300) };
    expect(needsKeywords(long)).toBe(true);
    const made = { ...long, keywordsHash: keywordsHash(long) };
    expect(needsKeywords(made)).toBe(false);
    expect(needsKeywords({ ...made, body: `${made.body} ბ` })).toBe(true);
  });

  it("key topics come back without # and _, without repeats, at most six", () => {
    expect(cleanKeywords(["#DNS_lookup", "dns lookup", "  ქეშირება ", "", 3, "_TTL_", "a", "b", "c", "d"])).toEqual(["DNS lookup", "ქეშირება", "TTL", "a", "b", "c"]);
  });

  it("„ჰკითხე“: the note cut at 8k, the last 10 messages, 20 kept", () => {
    const history = Array.from({ length: 25 }, (_, index) => ({ role: index % 2 ? "assistant" : "user", text: `m${index}`, at: index }) as const);
    const kept = appendAsk([], ...history);
    expect(kept).toHaveLength(ASK_HISTORY_LIMIT);
    expect(kept[0].text).toBe("m5");
    const payload = askPayload({ title: " ", body: "x".repeat(9000), askHistory: kept }, "ქსელები", "რა არის DNS?");
    expect(payload.content).toHaveLength(8000);
    expect(payload.history).toHaveLength(10);
    expect(payload.history[9]).toEqual({ role: "user", text: "m24" });
    expect(payload).toMatchObject({ title: "უსათაურო ჩანაწერი", subject: "ქსელები", message: "რა არის DNS?" });
  });

  it("an answer goes in after a blank line; suggestions name the first topic", () => {
    expect(insertAnswer("ტექსტი\n\n", " **DNS** არის ")).toBe("ტექსტი\n\n**DNS** არის\n");
    expect(insertAnswer("", "პასუხი")).toBe("პასუხი\n");
    expect(askSuggestions([])).toHaveLength(2);
    expect(askSuggestions(["DNS"])[2]).toBe("რა არის DNS?");
  });

  it("„ამ ჩანაწერიდან შექმენი“: the tool's address and the note as its source", () => {
    expect(noteToolHref("n 1", "quiz")).toBe("/quiz?tab=new&noteId=n%201");
    expect(noteToolHref("n1", "summary")).toBe("/generate?tab=new&mode=summary&noteId=n1");
    const note = { ...blankNote("s1", "t1", "2026-10-22", 1), title: "DNS", body: "ტექსტი" };
    expect(noteAsSource(note)).toEqual({ title: "DNS", text: "DNS\n\nტექსტი", link: { subjectId: "s1", topicId: "t1" } });
    expect(noteAsSource({ ...note, topicId: undefined })?.link).toBeUndefined();
    expect(noteAsSource({ ...note, body: " " })).toBeNull();
  });
});
