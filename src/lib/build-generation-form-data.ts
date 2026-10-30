import type { UploadedData } from "./generation-input";

export type GenerationInput = UploadedData;

/** `part`: one request of a deck asked for in parts (its count and the questions to skip). */
export function buildGenerationFormData(
  input: GenerationInput,
  part?: { count: number; avoidQuestions: string[] },
): FormData {
  const formData = new FormData();
  formData.append("inputType", input.inputType);
  formData.append("topic", input.topic);
  formData.append("cardCount", String(part?.count ?? input.cardCount));
  if (part?.avoidQuestions.length) formData.append("avoidQuestions", JSON.stringify(part.avoidQuestions.slice(0, 50)));
  if (input.difficulty) formData.append("difficulty", input.difficulty);
  // Not read by the model: kept with what's saved (the conspectus).
  if (input.sourceLabel) formData.append("sourceLabel", input.sourceLabel);

  if (input.inputType === "text") {
    formData.append("text", input.text);
  } else if (input.inputType === "youtube") {
    formData.append("youtubeUrl", input.youtubeUrl);
    if (input.youtubeRange) {
      formData.append("youtubeStart", String(input.youtubeRange.start));
      formData.append("youtubeEnd", String(input.youtubeRange.end));
    }
  } else if (input.inputType === "presentation") {
    // A saved presentation is sent as its slides' text, a .pptx as the file.
    if (input.file) formData.append("file", input.file);
    else formData.append("text", input.text);
  } else if (input.file) {
    formData.append("file", input.file);
  }

  return formData;
}
