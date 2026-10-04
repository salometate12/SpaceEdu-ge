import { describe, expect, it } from "vitest";
import {
  buildChatHistory,
  HISTORY_ASSISTANT_MAX_CHARS,
  HISTORY_MAX_CHARS,
  HISTORY_MAX_TURNS,
  wantsDetailedAnswer,
  type ChatTurn,
} from "./ai-teacher-conversation";
import { AiTeacherHistorySchema, buildAiTeacherMessages, HISTORY_SERVER_MAX_CHARS } from "./ai-teacher-request";

const user = (content: string): ChatTurn => ({ role: "user", content });
const bot = (content: string): ChatTurn => ({ role: "assistant", content });

describe("buildChatHistory", () => {
  it("keeps the last 10 turns, oldest first", () => {
    const turns = Array.from({ length: 14 }, (_, i) => (i % 2 ? bot(`a${i}`) : user(`q${i}`)));
    const history = buildChatHistory(turns);
    expect(history).toHaveLength(HISTORY_MAX_TURNS);
    expect(history[0].content).toBe("q4");
    expect(history.at(-1)?.content).toBe("a13");
  });

  it("shortens a long answer with an ellipsis, but never the student's question", () => {
    const history = buildChatHistory([user("ფოტოსინთეზი?"), bot("ა".repeat(5000)), user("ბ".repeat(2000))]);
    expect(history[1].content).toHaveLength(HISTORY_ASSISTANT_MAX_CHARS);
    expect(history[1].content.endsWith("…")).toBe(true);
    expect(history[2].content).toHaveLength(2000);
  });

  it("drops the oldest turns to stay under the total limit", () => {
    const turns = Array.from({ length: 10 }, (_, i) => (i % 2 ? bot("ა".repeat(1400)) : user("ბ".repeat(1400))));
    const history = buildChatHistory(turns);
    expect(history.reduce((sum, t) => sum + t.content.length, 0)).toBeLessThanOrEqual(HISTORY_MAX_CHARS);
    expect(history[0].role).toBe("user");
  });

  it("skips empty turns (e.g. a cancelled answer)", () => {
    expect(buildChatHistory([user("q"), bot("  "), user("q2")])).toEqual([user("q"), user("q2")]);
  });

  it("is empty for a new chat", () => {
    expect(buildChatHistory([])).toEqual([]);
  });
});

describe("history on the server", () => {
  it("accepts a valid history", () => {
    expect(AiTeacherHistorySchema.safeParse([user("q"), bot("a")]).success).toBe(true);
  });

  it("rejects a wrong role, an oversized message and too many turns", () => {
    expect(AiTeacherHistorySchema.safeParse([{ role: "system", content: "x" }]).success).toBe(false);
    expect(AiTeacherHistorySchema.safeParse([user("ა".repeat(HISTORY_SERVER_MAX_CHARS + 1))]).success).toBe(false);
    expect(AiTeacherHistorySchema.safeParse(Array.from({ length: 11 }, () => user("q"))).success).toBe(false);
  });

  it("builds messages: earlier turns, then the current question", () => {
    const messages = buildAiTeacherMessages([user("რა არის ფოტოსინთეზი?"), bot("პროცესი…")], "Learner: …\n\nStudent question: უფრო მოკლედ");
    expect(messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(messages[2].content).toContain("უფრო მოკლედ");
  });
});

describe("wantsDetailedAnswer", () => {
  it("spots requests for a longer answer", () => {
    for (const text of ["უფრო დეტალურად", "გაშალე ეს", "მეტი მაგალითი მომეცი", "ვრცლად ამიხსენი", "explain in detail"]) {
      expect(wantsDetailedAnswer(text)).toBe(true);
    }
    for (const text of ["უფრო მოკლედ", "რა არის ფოტოსინთეზი?", "კი"]) {
      expect(wantsDetailedAnswer(text)).toBe(false);
    }
  });
});
