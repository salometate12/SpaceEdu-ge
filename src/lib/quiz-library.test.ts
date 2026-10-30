import { describe, expect, it } from "vitest";
import { attemptFromRun, attemptTotals, startAttempt } from "./quiz-library";
import { answerTurn, createQuizRun, nextTurn, questionsToRepeat } from "./quiz-run";

describe("quiz attempts", () => {
  it("records answers, position and score as the run goes, finished at the end", () => {
    const attempt = startAttempt("quiz-1", 3, undefined, 100);
    expect(attempt).toMatchObject({ quizId: "quiz-1", currentIndex: 0, score: 0, startedAt: 100, finishedAt: null });

    let run = createQuizRun(3);
    run = nextTurn(answerTurn(run, 1, 1));
    let saved = attemptFromRun(attempt, run, 110);
    expect(saved).toMatchObject({ currentIndex: 1, score: 1, finishedAt: null, updatedAt: 110 });
    expect(saved.answers).toEqual([1, null, null]);

    run = nextTurn(answerTurn(run, 0, 2));
    run = nextTurn(answerTurn(run, 3, 3));
    // The wrong one comes back once at the end.
    run = nextTurn(answerTurn(run, 2, 2));
    saved = attemptFromRun(saved, run, 120);
    expect(saved).toMatchObject({ score: 2, finishedAt: 120 });
    expect(attemptTotals(saved)).toEqual({ correct: 2, total: 3 });
    // Saving again keeps the first finish time.
    expect(attemptFromRun(saved, run, 130).finishedAt).toBe(120);
  });

  it("a mistakes attempt holds only the wrong questions and scores those", () => {
    let run = createQuizRun(3);
    run = nextTurn(answerTurn(run, 0, 1));
    run = nextTurn(answerTurn(run, 2, 2));
    run = nextTurn(answerTurn(run, 0, 3));
    const wrong = [0, 2];
    expect(questionsToRepeat(run)).toEqual(wrong);
    const attempt = startAttempt("quiz-1", 3, wrong, 200);
    expect(attempt.only).toEqual(wrong);
    expect(attempt.run.turns.map((turn) => turn.question)).toEqual(wrong);
    let again = attempt.run;
    again = nextTurn(answerTurn(again, 1, 1));
    again = nextTurn(answerTurn(again, 3, 3));
    const saved = attemptFromRun(attempt, again, 210);
    expect(saved).toMatchObject({ score: 2, finishedAt: 210 });
  });
});
