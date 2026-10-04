import { beforeEach, describe, expect, it } from "vitest";
import {
  addTipLearnedToday,
  AI_TEACHER_WAITING_CARDS,
  nextWaitingCard,
  readTipsLearnedToday,
} from "./ai-teacher-waiting-cards";

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
const session = new MemoryStorage();
(globalThis as unknown as { window: object }).window = { localStorage: local, sessionStorage: session };

describe("waiting cards", () => {
  beforeEach(() => {
    local.clear();
    session.clear();
  });

  it("has ~30 cards per space with unique ids and both sides filled", () => {
    for (const space of ["student", "abiturient"] as const) {
      const cards = AI_TEACHER_WAITING_CARDS[space];
      expect(cards.length).toBeGreaterThanOrEqual(30);
      expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
      for (const card of cards) {
        expect(card.front.trim().length).toBeGreaterThan(5);
        expect(card.back.trim().length).toBeGreaterThan(20);
      }
    }
  });

  it("doesn't repeat a card within a session until all were shown", () => {
    const total = AI_TEACHER_WAITING_CARDS.student.length;
    const seen = Array.from({ length: total }, () => nextWaitingCard("student").id);
    expect(new Set(seen).size).toBe(total);
    // The next one starts a new cycle instead of failing.
    expect(AI_TEACHER_WAITING_CARDS.student.map((c) => c.id)).toContain(nextWaitingCard("student").id);
  });

  it("counts tips learned today and starts over the next day", () => {
    const today = new Date(2026, 9, 4, 12);
    expect(readTipsLearnedToday(today)).toBe(0);
    addTipLearnedToday(today);
    expect(addTipLearnedToday(today)).toBe(2);
    expect(readTipsLearnedToday(new Date(2026, 9, 5, 9))).toBe(0);
  });
});
