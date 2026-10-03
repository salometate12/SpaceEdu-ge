import { beforeEach, describe, expect, it } from "vitest";
import {
  AI_TEACHER_HISTORY_KEYS,
  LEGACY_AI_TEACHER_HISTORY_KEY,
  loadConversations,
  migrateLegacyConversations,
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
