import type { InputType } from "@/lib/ai/process-input";

export interface UploadedData {
  inputType: InputType;
  file: File | null;
  text: string;
  youtubeUrl: string;
  topic: string;
  cardCount: number;
}
