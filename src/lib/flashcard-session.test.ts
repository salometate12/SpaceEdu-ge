import { describe, expect, it } from "vitest";
import { answer, counts, fitsDeck, remaining, repeatUnknown, shuffleRest, startSession } from "./flashcard-session";

const ids = ["a", "b", "c"];

describe("flashcard session", () => {
  it("goes through every card, then repeats the unknown ones once, then finishes", () => {
    let s = startSession("d", ids, 0);
    s = answer(s, true, 1);
    s = answer(s, false, 2);
    s = answer(s, false, 3);
    expect(s).toMatchObject({ round: 2, order: ["b", "c"], index: 0, finishedAt: null });
    s = answer(s, true, 4);
    s = answer(s, false, 5);
    expect(s.finishedAt).toBe(5);
    expect(counts(s, ids)).toEqual({ known: 2, unknown: 1 });
  });

  it("finishes after round 1 when everything is known", () => {
    let s = startSession("d", ids, 0);
    for (let i = 0; i < 3; i += 1) s = answer(s, true, 10);
    expect(s.finishedAt).toBe(10);
    expect(s.round).toBe(1);
  });

  it("shuffles only what's left of the round", () => {
    let s = startSession("d", ["a", "b", "c", "d"], 0);
    s = answer(s, true, 1);
    const shuffled = shuffleRest(s, () => 0);
    expect(shuffled.order[0]).toBe("a");
    expect([...remaining(shuffled)].sort()).toEqual(["b", "c", "d"]);
  });

  it("repeats the unknown cards from the results", () => {
    let s = startSession("d", ids, 0);
    s = answer(s, true, 1);
    s = answer(s, true, 2);
    s = answer(s, false, 3);
    s = answer(s, false, 4);
    const again = repeatUnknown(s, 9);
    expect(again).toMatchObject({ order: ["c"], index: 0, finishedAt: null });
  });

  it("notices a session that no longer fits its deck", () => {
    expect(fitsDeck(startSession("d", ids), ids)).toBe(true);
    expect(fitsDeck(startSession("d", ids), ["a", "b"])).toBe(false);
  });
});
