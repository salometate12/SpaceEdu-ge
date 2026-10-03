import type { AiTeacherSpace } from "@/lib/ai-teacher-content";

export interface AiTeacherMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface AiTeacherConversation {
  id: string;
  /** Short label for the sidebar — the first thing the student asked. */
  title: string;
  messages: AiTeacherMessage[];
  updatedAt: number;
}

/** Each AI teacher keeps its own history, so an admin (or anyone who
 * switches space) never sees one space's chats in the other. */
export const AI_TEACHER_HISTORY_KEYS: Record<AiTeacherSpace, string> = {
  student: "spaceedu-ai-teacher-conversations-student",
  abiturient: "spaceedu-ai-teacher-conversations-abiturient",
};
/** The single shared key from before the split. /ai-teacher was the
 * student page then, so its chats move to the student key. */
export const LEGACY_AI_TEACHER_HISTORY_KEY = "spaceedu-ai-teacher-conversations";
const MAX_CONVERSATIONS = 20;
const TITLE_MAX_LENGTH = 80;

export function conversationTitleFrom(messages: AiTeacherMessage[]): string {
  const firstUser = messages.find((message) => message.role === "user");
  const raw = firstUser?.content.trim().replace(/\s+/g, " ") ?? "ახალი საუბარი";
  return raw.length > TITLE_MAX_LENGTH ? `${raw.slice(0, TITLE_MAX_LENGTH)}…` : raw;
}

/**
 * One-time move of the pre-split history onto the student key. Anything
 * already on the student key wins on an id clash. Safe to call often:
 * once the legacy key is gone it does nothing.
 */
export function migrateLegacyConversations(storage: Storage = window.localStorage): void {
  try {
    const legacyRaw = storage.getItem(LEGACY_AI_TEACHER_HISTORY_KEY);
    if (legacyRaw === null) return;
    const legacy = JSON.parse(legacyRaw) as unknown;
    const currentRaw = storage.getItem(AI_TEACHER_HISTORY_KEYS.student);
    const current = currentRaw ? (JSON.parse(currentRaw) as unknown) : [];
    if (Array.isArray(legacy) && legacy.length > 0) {
      const existing = Array.isArray(current) ? (current as AiTeacherConversation[]) : [];
      const ids = new Set(existing.map((entry) => entry?.id));
      const merged = [
        ...existing,
        ...(legacy as AiTeacherConversation[]).filter((entry) => !ids.has(entry?.id)),
      ]
        .sort((a, b) => (b?.updatedAt ?? 0) - (a?.updatedAt ?? 0))
        .slice(0, MAX_CONVERSATIONS);
      storage.setItem(AI_TEACHER_HISTORY_KEYS.student, JSON.stringify(merged));
    }
    storage.removeItem(LEGACY_AI_TEACHER_HISTORY_KEY);
  } catch {
    // Unreadable legacy data: nothing to recover, so stop retrying it.
    try {
      storage.removeItem(LEGACY_AI_TEACHER_HISTORY_KEY);
    } catch {
      // storage unavailable — history is a convenience, not critical.
    }
  }
}

export function loadConversations(
  space: AiTeacherSpace = "student",
): AiTeacherConversation[] {
  if (typeof window === "undefined") return [];
  migrateLegacyConversations();
  try {
    const raw = window.localStorage.getItem(AI_TEACHER_HISTORY_KEYS[space]);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AiTeacherConversation[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry) => entry && Array.isArray(entry.messages) && entry.messages.length > 0)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

/** Only conversations that actually got an answer are worth keeping. */
function isWorthSaving(messages: AiTeacherMessage[]): boolean {
  const hasUser = messages.some((m) => m.role === "user" && m.content.trim().length > 0);
  const hasAnswer = messages.some((m) => m.role === "assistant" && m.content.trim().length > 0);
  return hasUser && hasAnswer;
}

export function saveConversation(
  conversation: Omit<AiTeacherConversation, "updatedAt">,
  space: AiTeacherSpace = "student",
): AiTeacherConversation[] {
  if (typeof window === "undefined") return [];
  if (!isWorthSaving(conversation.messages)) return loadConversations(space);

  const stamped: AiTeacherConversation = { ...conversation, updatedAt: Date.now() };
  const others = loadConversations(space).filter((entry) => entry.id !== stamped.id);
  const next = [stamped, ...others]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CONVERSATIONS);

  try {
    window.localStorage.setItem(AI_TEACHER_HISTORY_KEYS[space], JSON.stringify(next));
  } catch {
    // storage full / unavailable — history is a convenience, not critical.
  }
  return next;
}

export function deleteConversation(
  id: string,
  space: AiTeacherSpace = "student",
): AiTeacherConversation[] {
  if (typeof window === "undefined") return [];
  const next = loadConversations(space).filter((entry) => entry.id !== id);
  try {
    window.localStorage.setItem(AI_TEACHER_HISTORY_KEYS[space], JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
