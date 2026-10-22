import { describe, expect, it } from "vitest";
import {
  answerTurn,
  createQuizRun,
  currentTurn,
  isLastTurn,
  isQuizOver,
  looksLikeCode,
  nextTurn,
  progressSegments,
  questionsToRepeat,
  quizTotals,
  willComeBack,
} from "./quiz-run";

/** Answers the current turn and moves on. */
const step = (run: ReturnType<typeof createQuizRun>, chosen: number, correct: number) => nextTurn(answerTurn(run, chosen, correct));

describe("quiz run: a wrong answer comes back once", () => {
  it("puts a wrongly answered question at the end, once", () => {
    let run = createQuizRun(3);
    run = answerTurn(run, 1, 0); // q0 wrong
    expect(willComeBack(run)).toBe(true);
    expect(run.turns.map((turn) => turn.question)).toEqual([0, 1, 2, 0]);
    run = nextTurn(run);
    run = step(run, 2, 2); // q1 right
    run = step(run, 3, 3); // q2 right
    expect(currentTurn(run)).toEqual({ question: 0, repeat: true });
    run = answerTurn(run, 2, 0); // wrong again: not added a second time
    expect(willComeBack(run)).toBe(false);
    expect(run.turns).toHaveLength(4);
    expect(isLastTurn(run)).toBe(true);
    run = nextTurn(run);
    expect(isQuizOver(run)).toBe(true);
    expect(quizTotals(run)).toEqual({ correct: 2, toRepeat: 1, firstTry: 2, total: 3 });
    expect(questionsToRepeat(run)).toEqual([0]);
  });

  it("counts a question as right once the repeat is answered correctly", () => {
    let run = createQuizRun(2);
    run = step(run, 1, 0);
    expect(quizTotals(run)).toMatchObject({ correct: 0, toRepeat: 1 });
    run = step(run, 0, 0);
    run = step(run, 0, 0); // the repeat, now right
    expect(isQuizOver(run)).toBe(true);
    expect(quizTotals(run)).toEqual({ correct: 2, toRepeat: 0, firstTry: 1, total: 2 });
    expect(questionsToRepeat(run)).toEqual([]);
  });

  it("keeps one progress segment per question", () => {
    let run = createQuizRun(3);
    expect(progressSegments(run)).toEqual(["current", "pending", "pending"]);
    run = answerTurn(run, 1, 0);
    expect(progressSegments(run, { checked: true })).toEqual(["wrong", "pending", "pending"]);
    run = nextTurn(run);
    run = step(run, 0, 0);
    run = step(run, 0, 0);
    // The repeat of q0: current again, still three segments.
    expect(progressSegments(run)).toEqual(["current", "correct", "correct"]);
  });

  it("repeats only the mistakes; the rest count as right", () => {
    const run = createQuizRun(4, [1, 3]);
    expect(run.turns.map((turn) => turn.question)).toEqual([1, 3]);
    expect(quizTotals(run)).toEqual({ correct: 2, toRepeat: 0, firstTry: 2, total: 4 });
    expect(progressSegments(run)).toEqual(["correct", "current", "correct", "pending"]);
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
