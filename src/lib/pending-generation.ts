import type { UploadedData } from "@/lib/generation-input";
import { buildGenerationFormData } from "./build-generation-form-data";

interface PendingSummaryGeneration {
  formData: FormData;
  topic: string;
}

let pendingSummary: PendingSummaryGeneration | null = null;

export function setPendingSummaryGeneration(data: UploadedData): void {
  pendingSummary = {
    formData: buildGenerationFormData(data),
    topic: data.topic,
  };
}

export function consumePendingSummaryGeneration(): PendingSummaryGeneration | null {
  const current = pendingSummary;
  pendingSummary = null;
  return current;
}
