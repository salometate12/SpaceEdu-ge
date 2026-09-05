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

const STORAGE_KEY = "spaceedu-ai-teacher-conversations";
const MAX_CONVERSATIONS = 20;
const TITLE_MAX_LENGTH = 80;

export function conversationTitleFrom(messages: AiTeacherMessage[]): string {
  const firstUser = messages.find((message) => message.role === "user");
  const raw = firstUser?.content.trim().replace(/\s+/g, " ") ?? "ახალი საუბარი";
  return raw.length > TITLE_MAX_LENGTH ? `${raw.slice(0, TITLE_MAX_LENGTH)}…` : raw;
}

export function loadConversations(): AiTeacherConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
): AiTeacherConversation[] {
  if (typeof window === "undefined") return [];
  if (!isWorthSaving(conversation.messages)) return loadConversations();

  const stamped: AiTeacherConversation = { ...conversation, updatedAt: Date.now() };
  const others = loadConversations().filter((entry) => entry.id !== stamped.id);
  const next = [stamped, ...others]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CONVERSATIONS);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage full / unavailable — history is a convenience, not critical.
  }
  return next;
}

export function deleteConversation(id: string): AiTeacherConversation[] {
  if (typeof window === "undefined") return [];
  const next = loadConversations().filter((entry) => entry.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
