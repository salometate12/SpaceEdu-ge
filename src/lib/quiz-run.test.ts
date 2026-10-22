import { describe, expect, it } from "vitest";
import { looksLikeCode, progressSegments } from "./quiz-run";

describe("quiz: progress segments", () => {
  it("shows checked answers, the current question and what's left", () => {
    expect(progressSegments([null, null, null], 0)).toEqual(["current", "pending", "pending"]);
    expect(progressSegments(["correct", "wrong", null, null], 2)).toEqual(["correct", "wrong", "current", "pending"]);
  });

  it("colours the current question as soon as it's checked", () => {
    expect(progressSegments(["correct", "wrong"], 1)).toEqual(["correct", "wrong"]);
  });
});

describe("quiz: code-looking answers", () => {
  it("spots commands and code", () => {
    for (const text of [
      "git push --force",
      "ls -la | grep notes",
      "echo hi > out.txt",
      "`npm install`",
      "cd /usr/local",
      "src/app/page.tsx",
      "print(x)",
      "mkdir notes",
      "SELECT * FROM users",
    ]) {
      expect(looksLikeCode(text), text).toBe(true);
    }
  });

  it("leaves ordinary Georgian answers alone", () => {
    for (const text of ["მოთხოვნის ელასტიურობა", "და/ან პირობა", "1/2 ნაწილი", "ფასი იზრდება (მოკლევადიან პერიოდში)", "Python ენა"]) {
      expect(looksLikeCode(text), text).toBe(false);
    }
  });
});
