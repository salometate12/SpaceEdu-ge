import type { UploadedData } from "./generation-input";

export type GenerationInput = UploadedData;

export function buildGenerationFormData(input: GenerationInput): FormData {
  const formData = new FormData();
  formData.append("inputType", input.inputType);
  formData.append("topic", input.topic);
  formData.append("cardCount", String(input.cardCount));

  if (input.inputType === "text") {
    formData.append("text", input.text);
  } else if (input.inputType === "youtube") {
    formData.append("youtubeUrl", input.youtubeUrl);
  } else if (input.file) {
    formData.append("file", input.file);
  }

  return formData;
}
