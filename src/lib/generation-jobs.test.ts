import { describe, expect, it } from "vitest";
import { isJobId, isStale, jobCards, JOB_STALE_MS, nextMissingPart, withPart, type GenerationJob } from "./generation-jobs";

const card = (question: string) => ({ question, answer: `${question}?` });
const job = (): GenerationJob => ({ id: "job-1", kind: "cards", status: "generating", counts: [25, 25], parts: [null, null], updatedAt: 0 });

describe("generation jobs", () => {
  it("fills parts in, takes the first part's title and is ready with the last", () => {
    let current = withPart(job(), 0, [card("a"), card("b")], { deckTitle: "უჯრედი", deckDescription: "აღწერა" }, 10);
    expect(current).toMatchObject({ status: "generating", deckTitle: "უჯრედი", updatedAt: 10 });
    expect(nextMissingPart(current)).toBe(1);
    current = withPart(current, 1, [card("c"), card("A")], { deckTitle: "სხვა" }, 20);
    expect(current.status).toBe("ready");
    expect(current.deckTitle).toBe("უჯრედი");
    expect(nextMissingPart(current)).toBe(-1);
    // The same question twice (case aside) is kept once.
    expect(jobCards(current).map((item) => item.question)).toEqual(["a", "b", "c"]);
  });

  it("parts can arrive out of order", () => {
    const current = withPart(job(), 1, [card("x")], {}, 5);
    expect(current.status).toBe("generating");
    expect(nextMissingPart(current)).toBe(0);
  });

  it("accepts only ids the browser makes", () => {
    expect(isJobId("job-lx2k9-ab12cd")).toBe(true);
    expect(isJobId("../other")).toBe(false);
    expect(isJobId("short")).toBe(false);
    expect(isJobId(42)).toBe(false);
  });

  it("calls a generation lost after three minutes without word", () => {
    expect(isStale(1000, 1000 + JOB_STALE_MS - 1)).toBe(false);
    expect(isStale(1000, 1000 + JOB_STALE_MS + 1)).toBe(true);
    expect(isStale(undefined, 5)).toBe(true);
  });
});
