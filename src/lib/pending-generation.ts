import type { UploadedData } from "@/lib/generation-input";
import { buildGenerationFormData } from "./build-generation-form-data";

interface PendingSummaryGeneration {
  formData: FormData;
  topic: string;
  /** What it was made from: its dropped files go to storage before the request (lib/stage-uploads). */
  data?: UploadedData;
}

let pendingSummary: PendingSummaryGeneration | null = null;

export function setPendingSummaryGeneration(data: UploadedData): void {
  pendingSummary = {
    formData: buildGenerationFormData(data),
    topic: data.topic,
    data,
  };
}

export function consumePendingSummaryGeneration(): PendingSummaryGeneration | null {
  const current = pendingSummary;
  pendingSummary = null;
  return current;
}
