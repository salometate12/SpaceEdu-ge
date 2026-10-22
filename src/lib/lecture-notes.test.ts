import { describe, expect, it } from "vitest";
import { createBlankLectureNote, withUnsavedBlanks, type LectureNote } from "./lecture-notes";

const note = (id: string, section: LectureNote["section"], title = "ლექცია"): LectureNote => ({
  ...createBlankLectureNote(section),
  id,
  title,
});

describe("notes arriving from the account", () => {
  it("replace the blank page a new device opened, where the section has notes", () => {
    const blank = note("blank", "lectures", "");
    const loaded = [note("n1", "lectures")];
    expect(withUnsavedBlanks(loaded, [blank]).map((n) => n.id)).toEqual(["n1"]);
  });

  it("keep that blank page where the section is still empty", () => {
    const blank = note("blank", "ideas", "");
    const loaded = [note("n1", "lectures")];
    expect(withUnsavedBlanks(loaded, [blank]).map((n) => n.id)).toEqual(["blank", "n1"]);
  });

  it("never keep a page that has something written on it but isn't on the account", () => {
    // Written here, then deleted on another device: the account's list wins.
    const written = note("old", "lectures", "წაშლილი სხვაგან");
    expect(withUnsavedBlanks([note("n1", "lectures")], [written]).map((n) => n.id)).toEqual(["n1"]);
  });
});
