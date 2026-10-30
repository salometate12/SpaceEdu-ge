import { describe, expect, it } from "vitest";
import {
  continueItems,
  deckItem,
  excerptOf,
  filterMaterials,
  firstTryMistakes,
  materialHref,
  quizItem,
  resumeCandidate,
  sortMaterials,
} from "./materials";
import { startSession, answer } from "@/lib/flashcard-session";
import { attemptFromRun, startAttempt, type SavedQuiz } from "@/lib/quiz-library";
import { answerTurn, nextTurn } from "@/lib/quiz-run";
import type { Deck } from "@/lib/types";

const deck = (id: string, extra: Partial<Deck> = {}): Deck => ({
  id,
  title: `დასტა ${id}`,
  description: "",
  category: "georgian",
  cards: ["a", "b", "c"].map((card) => ({ id: `${id}-${card}`, question: card, answer: card })),
  status: "ready",
  createdAt: 100,
  ...extra,
});

const quiz = (id: string, extra: Partial<SavedQuiz> = {}): SavedQuiz => ({
  id,
  title: `ქვიზი ${id}`,
  sourceType: "file",
  sourceName: "ლექცია",
  questionCount: 2,
  questions: [0, 1].map((n) => ({ id: n, questionText: `${n}`, options: ["a", "b", "c", "d"], correctAnswerIndex: 0, explanation: "" })),
  status: "ready",
  createdAt: 100,
  updatedAt: 100,
  ...extra,
});

describe("library items", () => {
  it("a deck counts known and to repeat from its session; all known is learned", () => {
    expect(deckItem(deck("d1"), null)).toMatchObject({ unfinished: false, done: false, deck: { known: 0, unknown: 0, started: false, cards: 3 } });

    let session = startSession("d1", ["d1-a", "d1-b", "d1-c"], 1);
    session = answer(session, true, 2);
    session = answer(session, false, 3);
    expect(deckItem(deck("d1"), session)).toMatchObject({ unfinished: true, done: false, deck: { known: 1, unknown: 1 } });

    session = answer(answer(answer(session, true, 4), true, 5), true, 6);
    expect(deckItem(deck("d1"), session)).toMatchObject({ unfinished: false, done: true, deck: { known: 3, unknown: 0 } });
  });

  it("older decks take their date from the id and their source from the label", () => {
    const old = deckItem(deck("custom-1700000000000", { createdAt: undefined, status: undefined, source: "YouTube: ლექცია 3" }), null);
    expect(old).toMatchObject({ createdAt: 1700000000000, status: "ready", source: "youtube", sourceName: "ლექცია 3" });
  });

  it("a quiz shows its last attempt: unfinished, then finished with the score and attempts", () => {
    const first = startAttempt("q1", 2, undefined, 10);
    let run = nextTurn(answerTurn(first.run, 1, 0));
    const halfway = attemptFromRun(first, run, 20);
    expect(quizItem(quiz("q1"), [halfway])).toMatchObject({ unfinished: true, quiz: { answered: 1, finished: false, attempts: 1 } });

    run = nextTurn(answerTurn(run, 0, 0));
    run = nextTurn(answerTurn(run, 0, 0));
    const done = attemptFromRun(first, run, 30);
    expect(quizItem(quiz("q1"), [done])).toMatchObject({ done: true, quiz: { correct: 1, questions: 2, finished: true, mistakes: true } });
    expect(firstTryMistakes(done.run.firstTry)).toEqual([0]);
  });

  it("filters by search and state, sorts generating first, then by the chosen date", () => {
    const items = [
      { ...deckItem(deck("a", { createdAt: 1, lastOpenedAt: 50 }), null), unfinished: true },
      deckItem(deck("b", { createdAt: 30, title: "ფიზიკა" }), null),
      deckItem(deck("c", { createdAt: 5, status: "generating" }), null),
    ];
    expect(filterMaterials(items, { query: "ფიზ" }).map((item) => item.id)).toEqual(["b"]);
    expect(filterMaterials(items, { filter: "unfinished" }).map((item) => item.id)).toEqual(["a"]);
    expect(sortMaterials(items, "opened").map((item) => item.id)).toEqual(["c", "a", "b"]);
    expect(sortMaterials(items, "newest").map((item) => item.id)).toEqual(["c", "b", "a"]);
    expect(resumeCandidate(items)?.id).toBe("a");
  });

  it("the dashboard offers unfinished ones, else the newest ready ones", () => {
    const fresh = [deckItem(deck("x", { createdAt: 1 }), null), deckItem(deck("y", { createdAt: 2 }), null), deckItem(deck("z", { createdAt: 3, status: "failed" }), null)];
    expect(continueItems(fresh).map((item) => item.id)).toEqual(["y", "x"]);
    const unfinished = { ...fresh[0], unfinished: true };
    expect(continueItems([unfinished, fresh[1]]).map((item) => item.id)).toEqual(["x"]);
  });

  it("links and excerpts", () => {
    expect(materialHref(quizItem(quiz("q 1"), []), "mistakes")).toBe("/quiz?quiz=q%201&mode=mistakes");
    expect(excerptOf("# უჯრედი\n\n**უჯრედი** სიცოცხლის ერთეულია.\n- მემბრანა\n- ბირთვი", "უჯრედი")).toBe("უჯრედი სიცოცხლის ერთეულია. მემბრანა");
  });
});
