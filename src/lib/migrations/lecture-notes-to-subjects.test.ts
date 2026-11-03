import { beforeEach, describe, expect, it } from "vitest";
import {
  BACKUP_KEY,
  cleanKeyword,
  isEmptyLecture,
  matchSubject,
  MIGRATION_FLAG_KEY,
  planMigration,
  runLectureNotesMigration,
  takeMovedToast,
} from "./lecture-notes-to-subjects";
import { getAllNoteRecords, getNotes, deleteNote } from "@/lib/subject-notes";
import { LECTURE_NOTES_STORAGE_KEY, SEMESTER_SUBJECTS_STORAGE_KEY } from "@/lib/user-data-keys";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}
const local = new MemoryStorage();
(globalThis as unknown as { window: object }).window = {
  localStorage: local,
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

const SUBJECTS = [
  { id: "s-net", name: "კომპიუტერული ქსელები" },
  { id: "s-math", name: "მათემატიკური ანალიზი" },
  { id: "s-stat", name: "სტატისტიკა" },
];

const old = (id: string, fields: Record<string, unknown> = {}) => ({
  id,
  title: `ლექცია ${id}`,
  date: "2026-10-15",
  content: "TCP/IP მოდელი და DNS",
  section: "lectures",
  pinned: false,
  aiKeywords: [],
  createdAt: 1000,
  updatedAt: 2000,
  ...fields,
});

describe("matching a note's subject", () => {
  it("the same name, any case and punctuation", () => {
    expect(matchSubject("სტატისტიკა", SUBJECTS)).toBe("s-stat");
    expect(matchSubject("  კომპიუტერული   ქსელები. ", SUBJECTS)).toBe("s-net");
  });

  it("one name inside the other, or the closest", () => {
    expect(matchSubject("ქსელები", SUBJECTS)).toBe("s-net");
    expect(matchSubject("მათემატიკური ანალიზი 1", SUBJECTS)).toBe("s-math");
    expect(matchSubject("კომპიუტერულ ქსელები", SUBJECTS)).toBe("s-net");
  });

  it("nothing close, or no name: no subject", () => {
    expect(matchSubject("ფილოსოფია", SUBJECTS)).toBeNull();
    expect(matchSubject("", SUBJECTS)).toBeNull();
  });
});

describe("planning the move", () => {
  it("moves lectures (and entries from before the journal had kinds), keeps the journal's own", () => {
    const plan = planMigration(
      [old("a", { subject: "სტატისტიკა" }), old("b", { section: undefined }), old("c", { section: "ideas" }), old("d", { section: "assignments" })],
      [],
      SUBJECTS,
      5000,
    );
    expect(plan.add.map((note) => note.legacyId)).toEqual(["a", "b"]);
    expect(plan.keep.map((item) => (item as { id: string }).id)).toEqual(["c", "d"]);
    expect(plan.lectures).toBe(2);
  });

  it("maps every field: subject, both pages as one text, date, keywords, pin, times", () => {
    const [note] = planMigration(
      [old("a", { subject: "ქსელები", contentRight: "მეორე გვერდი", pinned: true, aiKeywords: ["#TCP_IP", "DNS lookup", "#TCP_IP"] })],
      [],
      SUBJECTS,
      5000,
    ).add;
    expect(note).toEqual({
      id: "lecture-a",
      subjectId: "s-net",
      title: "ლექცია a",
      body: "TCP/IP მოდელი და DNS\n\nმეორე გვერდი",
      lectureDate: "2026-10-15",
      keywords: ["TCP IP", "DNS lookup"],
      askHistory: [],
      pinned: true,
      createdAt: 1000,
      updatedAt: 2000,
      legacyId: "a",
    });
  });

  it("unmatched notes go to „საგნის გარეშე“", () => {
    const [note] = planMigration([old("a", { subject: "ფილოსოფია" })], [], SUBJECTS, 5000).add;
    expect(note.subjectId).toBeNull();
  });

  it("leaves out empty notes: „უსათაურო“ and no text", () => {
    expect(isEmptyLecture({ title: "უსათაურო", content: "  " })).toBe(true);
    expect(isEmptyLecture({ title: "", content: "", contentRight: "" })).toBe(true);
    expect(isEmptyLecture({ title: "უსათაურო", content: "რაღაც" })).toBe(false);
    const plan = planMigration([old("a", { title: "უსათაურო", content: "" }), old("b", { title: "", content: "ტექსტი" })], [], SUBJECTS, 5000);
    expect(plan.add.map((note) => note.legacyId)).toEqual(["b"]);
    expect(plan.add[0].title).toBe("");
  });

  it("never twice: not a note already moved, nor the same id twice in the list", () => {
    const plan = planMigration([old("a"), old("a"), old("b")], [{ id: "lecture-b", legacyId: "b" }], SUBJECTS, 5000);
    expect(plan.add.map((note) => note.legacyId)).toEqual(["a"]);
  });

  it("an empty list, or entries without an id, change nothing", () => {
    expect(planMigration([], [], SUBJECTS, 5000)).toEqual({ add: [], keep: [], lectures: 0 });
    expect(planMigration([{ title: "x", content: "y" }], [], SUBJECTS, 5000).add).toEqual([]);
  });

  it("key topics without # or _", () => {
    expect(cleanKeyword("#მოთხოვნა_და_მიწოდება")).toBe("მოთხოვნა და მიწოდება");
  });
});

describe("running the move on this device", () => {
  beforeEach(() => local.clear());

  const seed = (notes: unknown[]) => {
    local.setItem(LECTURE_NOTES_STORAGE_KEY, JSON.stringify(notes));
    local.setItem(SEMESTER_SUBJECTS_STORAGE_KEY, JSON.stringify({ subjects: SUBJECTS, semesterLabel: "" }));
  };

  it("moves the lectures, keeps the rest of the journal, backs up, flags and toasts once", () => {
    seed([old("a", { subject: "სტატისტიკა" }), old("b", { section: "ideas" }), old("e", { title: "უსათაურო", content: "" })]);
    expect(runLectureNotesMigration(5000)).toBe(1);
    expect(getNotes().map((note) => [note.legacyId, note.subjectId])).toEqual([["a", "s-stat"]]);
    expect(JSON.parse(local.getItem(LECTURE_NOTES_STORAGE_KEY)!).map((item: { id: string }) => item.id)).toEqual(["b"]);
    expect(JSON.parse(local.getItem(BACKUP_KEY)!).map((item: { id: string }) => item.id)).toEqual(["a", "e"]);
    expect(local.getItem(MIGRATION_FLAG_KEY)).toBe("done");
    expect(takeMovedToast()).toBe(true);
    expect(takeMovedToast()).toBe(false);
  });

  it("running again adds nothing, even when another device brings the old notes back", () => {
    seed([old("a"), old("b")]);
    runLectureNotesMigration(5000);
    expect(runLectureNotesMigration(6000)).toBe(0);
    // Another device's copy of the old list arrives, with a note since deleted here.
    deleteNote("lecture-a", 7000);
    local.setItem(LECTURE_NOTES_STORAGE_KEY, JSON.stringify([old("a"), old("b"), old("c")]));
    expect(runLectureNotesMigration(8000)).toBe(1);
    expect(getNotes().map((note) => note.legacyId).sort()).toEqual(["b", "c"]);
    expect(getAllNoteRecords()).toHaveLength(3);
  });

  it("a broken old list doesn't throw", () => {
    local.setItem(LECTURE_NOTES_STORAGE_KEY, "{not json");
    expect(runLectureNotesMigration(5000)).toBe(0);
    expect(takeMovedToast()).toBe(false);
  });
});
