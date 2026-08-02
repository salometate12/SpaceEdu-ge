import type { UserModelMessage } from "ai";
import { buildUserMessage, type InputType } from "./process-input";
import { fetchYouTubeTranscript } from "./youtube";

export type GenerationMode = "flashcards" | "summary";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

export interface ParsedGenerationRequest {
  inputType: InputType;
  topic: string;
  cardCount: number;
  userMessage: UserModelMessage;
}

export async function parseGenerationFormData(
  formData: FormData,
  mode: GenerationMode,
): Promise<ParsedGenerationRequest> {
  const inputType = formData.get("inputType") as InputType;
  const topic = (formData.get("topic") as string) || "";
  const text = (formData.get("text") as string) || "";
  const youtubeUrl = (formData.get("youtubeUrl") as string) || "";
  const cardCountRaw = formData.get("cardCount");
  const cardCount = cardCountRaw ? Number(cardCountRaw) : 12;
  const file = formData.get("file") as File | null;

  if (!inputType) {
    throw new Error("inputType სავალდებულოა");
  }

  if (file && file.size > MAX_FILE_BYTES) {
    throw new Error("ფაილი ძალიან დიდია. მაქსიმუმ 20MB.");
  }

  let youtubeTranscript: string | undefined;

  if (inputType === "youtube") {
    if (!youtubeUrl.trim()) {
      throw new Error("YouTube ბმული სავალდებულოა");
    }
    youtubeTranscript = await fetchYouTubeTranscript(youtubeUrl.trim());
  }

  if (inputType === "text" && !text.trim()) {
    throw new Error("ტექსტი სავალდებულოა");
  }

  if (
    (inputType === "file" || inputType === "audio" || inputType === "video") &&
    !file
  ) {
    throw new Error("ფაილი სავალდებულოა");
  }

  const userMessage = await buildUserMessage(inputType, {
    file,
    text: text.trim(),
    youtubeTranscript,
    topic,
    cardCount: Math.min(Math.max(cardCount, 5), 25),
    mode,
  });

  return {
    inputType,
    topic,
    cardCount,
    userMessage,
  };
}

import { logMissingAiEnvKeys } from "@/lib/ai/env-diagnostics";
import { ensureAdminRuntimeSettings } from "@/lib/admin/bootstrap-settings";
import { requireAtLeastOneLlmProvider } from "@/lib/ai/llm-providers";

/** Validates LLM env + logs missing keys (temporary diagnostics). */
export function requireApiKey(routeScope = "api"): void {
  ensureAdminRuntimeSettings();
  logMissingAiEnvKeys(routeScope);
  requireAtLeastOneLlmProvider();
}
