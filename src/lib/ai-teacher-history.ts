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
  /** Set once the student renamed it; the title then stops following the
   * first question. */
  renamed?: boolean;
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
const MAX_CONVERSATIONS = 50;
export const TITLE_MAX_LENGTH = 40;

/** A one-line title from the first question: markdown and extra spaces
 * stripped, cut at a word boundary to ~40 characters. */
export function conversationTitleFrom(messages: AiTeacherMessage[]): string {
  const firstUser = messages.find((message) => message.role === "user");
  const raw = (firstUser?.content ?? "")
    .replace(/[*_`#>~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return "ახალი საუბარი";
  if (raw.length <= TITLE_MAX_LENGTH) return raw;
  const cut = raw.slice(0, TITLE_MAX_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > TITLE_MAX_LENGTH * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

export type ConversationGroupLabel = "დღეს" | "გუშინ" | "ბოლო 7 დღე" | "ადრე";

/** Conversations bucketed by their last update, newest first. */
export function groupConversationsByDate(
  conversations: AiTeacherConversation[],
  now: Date = new Date(),
): { label: ConversationGroupLabel; items: AiTeacherConversation[] }[] {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 86_400_000;
  const groups: Record<ConversationGroupLabel, AiTeacherConversation[]> = {
    "დღეს": [],
    "გუშინ": [],
    "ბოლო 7 დღე": [],
    "ადრე": [],
  };
  for (const conversation of [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)) {
    const at = conversation.updatedAt;
    if (at >= startOfToday) groups["დღეს"].push(conversation);
    else if (at >= startOfToday - day) groups["გუშინ"].push(conversation);
    else if (at >= startOfToday - 7 * day) groups["ბოლო 7 დღე"].push(conversation);
    else groups["ადრე"].push(conversation);
  }
  return (Object.keys(groups) as ConversationGroupLabel[])
    .filter((label) => groups[label].length > 0)
    .map((label) => ({ label, items: groups[label] }));
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

  const existing = loadConversations(space).find((entry) => entry.id === conversation.id);
  const stamped: AiTeacherConversation = {
    ...conversation,
    // A name the student chose survives new messages.
    ...(existing?.renamed ? { title: existing.title, renamed: true } : {}),
    updatedAt: Date.now(),
  };
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

/** Renames a conversation; an empty name goes back to the first question. */
export function renameConversation(
  id: string,
  title: string,
  space: AiTeacherSpace = "student",
): AiTeacherConversation[] {
  if (typeof window === "undefined") return [];
  const clean = title.replace(/\s+/g, " ").trim().slice(0, 80);
  const next = loadConversations(space).map((entry) =>
    entry.id === id
      ? clean
        ? { ...entry, title: clean, renamed: true }
        : { ...entry, title: conversationTitleFrom(entry.messages), renamed: false }
      : entry,
  );
  try {
    window.localStorage.setItem(AI_TEACHER_HISTORY_KEYS[space], JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
