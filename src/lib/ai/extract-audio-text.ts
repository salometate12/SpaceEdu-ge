import "server-only";
import { generateLlmText } from "@/lib/gemini";

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const MIN_EXTRACTED_CHARS = 10;

export const AUDIO_TEXT_EMPTY_ERROR =
  "აუდიოში საკმარისი საუბარი ვერ ამოვიცანით. სცადე უფრო ხმოვანი ან სუფთა ჩანაწერი.";

export class AudioExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudioExtractError";
  }
}

const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
]);

const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "m4a", "aac", "ogg", "webm", "flac", "mp4"]);

function isSupportedAudio(file: File): boolean {
  if (SUPPORTED_AUDIO_TYPES.has(file.type.toLowerCase())) return true;
  const parts = file.name.toLowerCase().split(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "";
  return AUDIO_EXTENSIONS.has(ext);
}

const AUDIO_SYSTEM_PROMPT =
  "You are a precise speech-to-text transcription engine. Listen to the provided audio recording (lecture, interview, notes, podcast excerpt) and transcribe every spoken word verbatim in its original language, as clean plain-text paragraphs (no timestamps, no speaker labels unless multiple distinct speakers make it necessary for clarity). If the audio has no discernible speech, briefly describe what is audible instead. Output ONLY the transcript or description — no commentary, no markdown code fences, no preamble.";

/**
 * Turns an audio recording (lecture, voice notes, interview, etc.) into
 * plain text via a multimodal LLM call, so it can flow through the same
 * text-based research pipeline as PDFs/TXT/MD/photos.
 */
export async function extractTextFromAudioFile(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new AudioExtractError(AUDIO_TEXT_EMPTY_ERROR);
  }

  if (file.size > MAX_AUDIO_BYTES) {
    throw new AudioExtractError("აუდიო ფაილი ძალიან დიდია. მაქსიმუმ 20 MB.");
  }

  if (!isSupportedAudio(file)) {
    throw new AudioExtractError("მხოლოდ MP3, WAV, M4A, AAC, OGG ფორმატის აუდიოა დაშვებული.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mediaType = file.type || "audio/mpeg";

  let text: string;
  try {
    text = await generateLlmText({
      system: AUDIO_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "გადაწერე ამ აუდიო ჩანაწერის შიგთავსი." },
            { type: "file", data: buffer, mediaType },
          ],
        },
      ],
      temperature: 0.1,
    });
  } catch {
    throw new AudioExtractError(AUDIO_TEXT_EMPTY_ERROR);
  }

  const normalized = text.trim();

  if (normalized.length < MIN_EXTRACTED_CHARS) {
    throw new AudioExtractError(AUDIO_TEXT_EMPTY_ERROR);
  }

  return normalized.slice(0, 120_000);
}
