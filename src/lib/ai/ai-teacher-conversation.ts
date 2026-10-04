/**
 * The recent turns of an AI-teacher chat, sent with each question so the
 * model knows what „უფრო მოკლედ“ or „კი“ refers to. Pure (no zod), so the
 * page and the floating chat can both use it.
 */

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** How many earlier messages go with a question. */
export const HISTORY_MAX_TURNS = 10;
/** A long assistant answer is cut to this many characters (plus „…“). */
export const HISTORY_ASSISTANT_MAX_CHARS = 1500;
/** Upper bound for the whole history (well under /api/ai's 100 KB). */
export const HISTORY_MAX_CHARS = 12_000;

function trimTurn(turn: ChatTurn): ChatTurn {
  const content = turn.content.trim();
  if (turn.role === "assistant" && content.length > HISTORY_ASSISTANT_MAX_CHARS) {
    return { role: "assistant", content: `${content.slice(0, HISTORY_ASSISTANT_MAX_CHARS - 1).trimEnd()}…` };
  }
  return { role: turn.role, content };
}

/**
 * The last turns before the current question: empty ones dropped, long
 * answers shortened, and the oldest turns dropped until the total fits.
 */
export function buildChatHistory(messages: readonly ChatTurn[]): ChatTurn[] {
  const turns = messages
    .filter((message) => message.content.trim().length > 0)
    .slice(-HISTORY_MAX_TURNS)
    .map(trimTurn);
  let total = turns.reduce((sum, turn) => sum + turn.content.length, 0);
  while (turns.length > 0 && total > HISTORY_MAX_CHARS) {
    total -= turns.shift()!.content.length;
  }
  // A history that starts with an answer has lost its question; drop it.
  while (turns.length > 0 && turns[0].role === "assistant") turns.shift();
  return turns;
}

const DETAIL_PATTERN =
  /(უფრო\s+)?დეტალურ|გაშალე|გაშლილ|ვრცლად|სიღრმისეულ|მეტი\s+მაგალით|უფრო\s+მეტი|in\s+detail|more\s+detail|elaborate|more\s+examples/i;

/** The student asked for a longer answer („უფრო დეტალურად“, „გაშალე“…). */
export function wantsDetailedAnswer(message: string): boolean {
  return DETAIL_PATTERN.test(message);
}

/**
 * Output caps for the visible answer: a safety net only — the prompt keeps
 * answers short. Georgian is token-heavy (~5 tokens a word), so 300–350
 * words already take ~1,700 tokens; the caps leave room for that.
 */
export const AI_TEACHER_MAX_OUTPUT_TOKENS = { normal: 2500, detailed: 5000 } as const;
