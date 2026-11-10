import type { ModelMessage, UserContent } from "ai";
import { z } from "zod";
import { CHAT_PHOTO_MAX } from "@/lib/chat-photos";
import { HISTORY_MAX_TURNS, type ChatTurn } from "./ai-teacher-conversation";
import type { LoadedPhoto } from "./chat-photos-server";

/** Longest single history message the server accepts. */
export const HISTORY_SERVER_MAX_CHARS = 4000;

const PhotoPathsSchema = z.array(z.string().min(1).max(400)).max(CHAT_PHOTO_MAX);

export const AiTeacherHistorySchema = z
  .array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(HISTORY_SERVER_MAX_CHARS),
      images: PhotoPathsSchema.optional(),
    }),
  )
  .max(HISTORY_MAX_TURNS);

/** The current question's photos (storage paths). */
export const AiTeacherImagesSchema = PhotoPathsSchema.default([]);

/** Every photo path a request names: the history's and the question's. */
export function photoPathsOf(history: ChatTurn[], images: string[]): string[] {
  return [...history.flatMap((turn) => (turn.role === "user" ? (turn.images ?? []) : [])), ...images];
}

/**
 * Said right next to the current question's photos: models tend to "read" a
 * blurred photo by inventing a problem, and the system prompt alone doesn't
 * stop that.
 */
export const PHOTO_CHECK =
  "Photo check, before answering: first decide whether every line of the photo is sharp enough to read with certainty. Student photos are often blurred; a blurred, cut-off or tiny photo must never be solved or guessed at, even partly — inventing a problem the student didn't send is the worst possible answer. In that case reply only, in Georgian, which part you can't read, and ask them to take the photo again, closer and in good light. Only when it is clearly legible, answer the question.";

function userContent(text: string, paths: string[] | undefined, photos: Map<string, LoadedPhoto>, check = false): UserContent {
  const parts = (paths ?? []).flatMap((path) => {
    const photo = photos.get(path);
    return photo ? [{ type: "image" as const, image: photo.data, mediaType: photo.mediaType }] : [];
  });
  if (!parts.length) return text;
  // The check comes last, after the question, where it weighs most.
  return [...parts, { type: "text" as const, text }, ...(check ? [{ type: "text" as const, text: PHOTO_CHECK }] : [])];
}

/** Earlier turns first, then the current question (with its learner line,
 * reference material and photos) as the last user message. */
export function buildAiTeacherMessages(
  history: ChatTurn[],
  currentPrompt: string,
  images: string[] = [],
  photos: Map<string, LoadedPhoto> = new Map(),
): ModelMessage[] {
  return [
    ...history.map((turn): ModelMessage =>
      turn.role === "user" ? { role: "user", content: userContent(turn.content, turn.images, photos) } : { role: "assistant", content: turn.content },
    ),
    { role: "user", content: userContent(currentPrompt, images, photos, true) },
  ];
}
