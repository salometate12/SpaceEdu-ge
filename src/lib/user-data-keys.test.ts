import { describe, expect, it } from "vitest";
import {
  mergeCategoryAccuracy,
  mergeDailyGoals,
  mergeDailyQuests,
  mergeDeckProgress,
  mergeJournalProgress,
  mergeQuizAttempts,
  mergeStreak,
  mergeToolUsage,
} from "./user-data-keys";

const context = { localAt: 1, remoteAt: 2 };

describe("progress merges: nothing earned on either device is lost", () => {
  it("streak: every day active on either device", () => {
    expect(
      mergeStreak({ activityDates: ["2026-10-20", "2026-10-22"] }, { activityDates: ["2026-10-21", "2026-10-22"] }, context),
    ).toEqual({ activityDates: ["2026-10-20", "2026-10-21", "2026-10-22"] });
  });

  it("goals: both devices' goals, done on either is done", () => {
    expect(
      mergeDailyGoals(
        [{ id: "g1", text: "ქვიზი", done: true }],
        [
          { id: "g1", text: "ქვიზი", done: false },
          { id: "g2", text: "კონსპექტი", done: false },
        ],
        context,
      ),
    ).toEqual([
      { id: "g1", text: "ქვიზი", done: true },
      { id: "g2", text: "კონსპექტი", done: false },
    ]);
  });

  it("quests: on the same day each quest's larger progress; otherwise the later day", () => {
    expect(
      mergeDailyQuests({ date: "2026-10-22", progress: { quiz: 2, read: 0 } }, { date: "2026-10-22", progress: { quiz: 1, read: 3 } }, context),
    ).toEqual({ date: "2026-10-22", progress: { quiz: 2, read: 3 } });
    const today = { date: "2026-10-22", progress: { quiz: 1 } };
    expect(mergeDailyQuests({ date: "2026-10-21", progress: { quiz: 5 } }, today, context)).toBe(today);
  });

  it("deck progress: per deck, cards learned on either device", () => {
    expect(
      mergeDeckProgress(
        [{ deckId: "bio", learnedCardIds: ["c1", "c2"] }],
        [
          { deckId: "bio", learnedCardIds: ["c2", "c3"] },
          { deckId: "chem", learnedCardIds: ["x"] },
        ],
        context,
      ),
    ).toEqual([
      { deckId: "bio", learnedCardIds: ["c1", "c2", "c3"] },
      { deckId: "chem", learnedCardIds: ["x"] },
    ]);
  });

  it("category accuracy: per category, the tally with more attempts", () => {
    expect(
      mergeCategoryAccuracy(
        { reading: { correct: 8, total: 10 }, grammar: { correct: 1, total: 2 } },
        { reading: { correct: 3, total: 4 }, grammar: { correct: 4, total: 6 }, vocab: { correct: 1, total: 1 } },
        context,
      ),
    ).toEqual({
      reading: { correct: 8, total: 10 },
      grammar: { correct: 4, total: 6 },
      vocab: { correct: 1, total: 1 },
    });
  });

  it("quiz results and tool usage: both devices' entries, once each, in time order", () => {
    const a = { at: 1, correct: 3, total: 5 };
    const b = { at: 2, correct: 5, total: 5 };
    expect(mergeQuizAttempts([a, b], [a, { at: 3, correct: 1, total: 2 }], context)).toEqual([a, b, { at: 3, correct: 1, total: 2 }]);
    expect(
      mergeToolUsage([{ id: "e2", timestamp: 20 }], [{ id: "e1", timestamp: 10 }, { id: "e2", timestamp: 20 }], context),
    ).toEqual([
      { id: "e1", timestamp: 10 },
      { id: "e2", timestamp: 20 },
    ]);
  });

  it("journal XP: the larger XP, the streak of the later save, unlocks from both", () => {
    expect(
      mergeJournalProgress(
        { xp: 300, streak: 1, lastSaveDate: "2026-10-22", unlocked: { first: true } },
        { xp: 450, streak: 6, lastSaveDate: "2026-10-20", unlocked: { week: true } },
        context,
      ),
    ).toEqual({ xp: 450, streak: 1, lastSaveDate: "2026-10-22", unlocked: { week: true, first: true } });
  });
});
