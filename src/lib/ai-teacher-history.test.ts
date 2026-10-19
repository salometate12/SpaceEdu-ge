import { beforeEach, describe, expect, it } from "vitest";
import {
  AI_TEACHER_HISTORY_KEYS,
  conversationTitleFrom,
  groupConversationsByDate,
  LEGACY_AI_TEACHER_HISTORY_KEY,
  loadConversations,
  migrateLegacyConversations,
  renameConversation,
  saveConversation,
} from "./ai-teacher-history";

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
}

const storage = new MemoryStorage();
(globalThis as unknown as { window: { localStorage: Storage } }).window = { localStorage: storage };

function conversation(id: string, updatedAt: number) {
  return {
    id,
    title: id,
    updatedAt,
    messages: [
      { id: `${id}-q`, role: "user" as const, content: "კითხვა" },
      { id: `${id}-a`, role: "assistant" as const, content: "პასუხი" },
    ],
  };
}

describe("AI teacher history", () => {
  beforeEach(() => storage.clear());

  it("moves the old shared history to the student key once, then drops it", () => {
    storage.setItem(LEGACY_AI_TEACHER_HISTORY_KEY, JSON.stringify([conversation("old", 1)]));

    expect(loadConversations("student").map((c) => c.id)).toEqual(["old"]);
    expect(loadConversations("abiturient")).toEqual([]);
    expect(storage.getItem(LEGACY_AI_TEACHER_HISTORY_KEY)).toBeNull();
    expect(storage.getItem(AI_TEACHER_HISTORY_KEYS.abiturient)).toBeNull();
  });

  it("keeps chats already on the student key and doesn't duplicate them", () => {
    storage.setItem(AI_TEACHER_HISTORY_KEYS.student, JSON.stringify([conversation("a", 3)]));
    storage.setItem(
      LEGACY_AI_TEACHER_HISTORY_KEY,
      JSON.stringify([conversation("a", 1), conversation("b", 2)]),
    );
    migrateLegacyConversations(storage);

    const ids = loadConversations("student").map((c) => c.id);
    expect(ids).toEqual(["a", "b"]);
  });

  it("drops an unreadable legacy key without touching the new ones", () => {
    storage.setItem(LEGACY_AI_TEACHER_HISTORY_KEY, "not json");
    expect(loadConversations("student")).toEqual([]);
    expect(storage.getItem(LEGACY_AI_TEACHER_HISTORY_KEY)).toBeNull();
  });

  it("keeps the two spaces' chats apart", () => {
    saveConversation(conversation("s", 1), "student");
    saveConversation(conversation("a", 1), "abiturient");
    expect(loadConversations("student").map((c) => c.id)).toEqual(["s"]);
    expect(loadConversations("abiturient").map((c) => c.id)).toEqual(["a"]);
  });
});

describe("sidebar helpers", () => {
  it("titles a chat from its first question, ~40 chars at a word boundary", () => {
    const title = conversationTitleFrom([
      { id: "q", role: "user", content: "**ამიხსენი** მოთხოვნის ფასით ელასტიურობა — ინტუიცია, ფორმულა და მაგალითი" },
    ]);
    expect(title.length).toBeLessThanOrEqual(41);
    expect(title.endsWith("…")).toBe(true);
    expect(title).not.toContain("*");
  });

  it("groups conversations into today / yesterday / last 7 days / earlier", () => {
    const now = new Date(2026, 9, 4, 15, 0);
    const at = (daysAgo: number, hour = 10) => new Date(2026, 9, 4 - daysAgo, hour).getTime();
    const groups = groupConversationsByDate(
      [
        { ...conversation("old", at(20)) },
        { ...conversation("today", at(0)) },
        { ...conversation("yesterday", at(1, 23)) },
        { ...conversation("week", at(5)) },
      ],
      now,
    );
    expect(groups.map((g) => [g.label, g.items.map((c) => c.id)])).toEqual([
      ["დღეს", ["today"]],
      ["გუშინ", ["yesterday"]],
      ["ბოლო 7 დღე", ["week"]],
      ["ადრე", ["old"]],
    ]);
  });

  it("keeps a renamed title when the chat gets new messages", () => {
    saveConversation(conversation("r", 1), "student");
    renameConversation("r", "ჩემი სახელი", "student");
    saveConversation({ ...conversation("r", 2), title: "ავტომატური სათაური" }, "student");
    const [saved] = loadConversations("student");
    expect(saved.title).toBe("ჩემი სახელი");
    renameConversation("r", "", "student");
    expect(loadConversations("student")[0].title).toBe("კითხვა");
  });
});
