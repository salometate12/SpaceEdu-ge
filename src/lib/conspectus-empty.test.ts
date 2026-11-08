import { describe, expect, it } from "vitest";
import {
  decodeSkippedFiles,
  encodeSkippedFiles,
  isLetterConspectus,
  isNoContentAnswer,
  mightBeNoContent,
  noTextAdvice,
  noTextHeadline,
  skippedFilesLabel,
} from "./conspectus-empty";

describe("a conspectus from material with no text", () => {
  it("the marker, escaped or not, and its beginning while it streams", () => {
    expect(isNoContentAnswer("[[NO_CONTENT]]")).toBe(true);
    expect(isNoContentAnswer("\\[\\[NO\\_CONTENT\\]\\]\n")).toBe(true);
    expect(isNoContentAnswer("# DNS\n\nტექსტი")).toBe(false);
    expect(mightBeNoContent("[[NO_")).toBe(true);
    expect(mightBeNoContent("\\[\\[NO")).toBe(true);
    expect(mightBeNoContent("# DNS")).toBe(false);
    expect(mightBeNoContent("")).toBe(false);
  });

  it("an old letter saved as a conspectus, and a real one", () => {
    expect(isLetterConspectus("მოგესალმებით! სამწუხაროდ, სლაიდები ცარიელია. გთხოვთ, მომაწოდოთ ტექსტი.")).toBe(true);
    expect(isLetterConspectus("# ინტეგრალები\n\n## განსაზღვრული ინტეგრალი\n\n**ნიუტონ-ლაიბნიცის ფორმულა**")).toBe(false);
    expect(isLetterConspectus(`# მისალმების ეტიკეტი\n\n${"მოგესალმებით ფორმალური ფორმაა. ".repeat(40)}`)).toBe(false);
  });

  it("what the screen says", () => {
    expect(noTextHeadline(["ლექცია 3.pptx"])).toBe("„ლექცია 3“-ში ტექსტი ვერ ვიპოვე");
    expect(noTextHeadline(["a.pptx", "b.pptx"])).toBe("„a“-ში და კიდევ 1 ფაილში ტექსტი ვერ ვიპოვე");
    expect(noTextAdvice(["ლექცია 3.pptx"])).toBe("სლაიდებზე ტექსტი სურათადაა ჩასმული. სცადე იგივე ლექცია PDF-ად, ან ჩასვი ტექსტი ხელით. კრედიტი არ დახარჯულა.");
    expect(noTextAdvice(["a.docx"])).toContain("ფაილში ტექსტი");
    expect(skippedFilesLabel(1)).toBe("1 ფაილი გამოტოვებულია: ტექსტი ვერ ვიპოვე");
  });

  it("the skipped files' header round-trips Georgian names", () => {
    expect(decodeSkippedFiles(encodeSkippedFiles(["ლექცია 3.pptx"]))).toEqual(["ლექცია 3.pptx"]);
    expect(decodeSkippedFiles("%%")).toEqual([]);
    expect(decodeSkippedFiles(null)).toEqual([]);
  });
});
