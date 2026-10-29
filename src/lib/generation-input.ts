import type { InputType } from "@/lib/ai/process-input";
import type { Difficulty } from "@/lib/generation-options";

export interface UploadedData {
  inputType: InputType;
  file: File | null;
  text: string;
  youtubeUrl: string;
  topic: string;
  cardCount: number;
  difficulty?: Difficulty | null;
  /** Seconds; only part of the YouTube video. */
  youtubeRange?: { start: number; end: number } | null;
  /** What the deck says it was made from, e.g. „პრეზენტაცია: უჯრედი“. */
  sourceLabel?: string;
}
