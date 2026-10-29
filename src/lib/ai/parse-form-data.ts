import type { UserModelMessage } from "ai";
import { buildUserMessage, type InputType } from "./process-input";
import { fetchYouTubeTranscript } from "./youtube";
import { GenerationInputError, parseAvoidQuestions, parseCardCount, parseDifficulty, type Difficulty } from "@/lib/generation-options";

export type GenerationMode = "flashcards" | "summary";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

export interface ParsedGenerationRequest {
  inputType: InputType;
  topic: string;
  cardCount: number;
  difficulty: Difficulty | null;
  userMessage: UserModelMessage;
}

const INPUT_TYPES: InputType[] = ["file", "audio", "video", "youtube", "text", "presentation"];

export async function parseGenerationFormData(
  formData: FormData,
  mode: GenerationMode,
): Promise<ParsedGenerationRequest> {
  const inputType = formData.get("inputType") as InputType;
  const topic = (formData.get("topic") as string) || "";
  const text = (formData.get("text") as string) || "";
  const youtubeUrl = (formData.get("youtubeUrl") as string) || "";
  // Checked before anything costly: an old client asking for 80 gets a 400.
  const cardCount = parseCardCount(formData.get("cardCount"));
  const difficulty = parseDifficulty(formData.get("difficulty"));
  const avoidQuestions = parseAvoidQuestions(formData.get("avoidQuestions"));
  const file = formData.get("file") as File | null;
  const ytStart = Number(formData.get("youtubeStart"));
  const ytEnd = Number(formData.get("youtubeEnd"));
  const youtubeRange =
    formData.has("youtubeStart") && Number.isFinite(ytStart) && Number.isFinite(ytEnd) && ytEnd > ytStart
      ? { start: ytStart, end: ytEnd }
      : null;

  if (!inputType || !INPUT_TYPES.includes(inputType)) {
    throw new GenerationInputError("მასალის ტიპი არასწორია.");
  }

  if (file && file.size > MAX_FILE_BYTES) {
    throw new GenerationInputError("ფაილი ძალიან დიდია. მაქსიმუმ 20MB.");
  }

  let youtubeTranscript: string | undefined;

  if (inputType === "youtube") {
    if (!youtubeUrl.trim()) {
      throw new Error("YouTube ბმული სავალდებულოა");
    }
    youtubeTranscript = await fetchYouTubeTranscript(youtubeUrl.trim(), youtubeRange);
  }

  if (inputType === "text" && !text.trim()) {
    throw new GenerationInputError("ტექსტი სავალდებულოა");
  }

  // A saved presentation arrives as text, a .pptx as a file.
  if (inputType === "presentation" && !text.trim() && !file) {
    throw new GenerationInputError("აირჩიე პრეზენტაცია ან ატვირთე .pptx ფაილი.");
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
    cardCount,
    difficulty,
    avoidQuestions,
    mode,
  });

  return {
    inputType,
    topic,
    cardCount,
    difficulty,
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
