import type { ModelMessage } from "ai";
import { z } from "zod";
import { HISTORY_MAX_TURNS, type ChatTurn } from "./ai-teacher-conversation";

/** Longest single history message the server accepts. */
export const HISTORY_SERVER_MAX_CHARS = 4000;

export const AiTeacherHistorySchema = z
  .array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(HISTORY_SERVER_MAX_CHARS),
    }),
  )
  .max(HISTORY_MAX_TURNS);

/** Earlier turns first, then the current question (with its learner line
 * and reference material) as the last user message. */
export function buildAiTeacherMessages(history: ChatTurn[], currentPrompt: string): ModelMessage[] {
  return [
    ...history.map((turn) => ({ role: turn.role, content: turn.content }) as ModelMessage),
    { role: "user", content: currentPrompt },
  ];
}
