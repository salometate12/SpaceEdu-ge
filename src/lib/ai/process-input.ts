import mammoth from "mammoth";
import type { UserModelMessage } from "ai";
import { extractPptxText } from "@/lib/pptx/extractText";
import { DIFFICULTY_HINT, GenerationInputError, type Difficulty } from "@/lib/generation-options";

export type InputType = "file" | "audio" | "video" | "youtube" | "text" | "presentation";
export type GenerationMode = "flashcards" | "summary";

const TEXT_MIME = ["text/plain"];
const IMAGE_MIME = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const PDF_MIME = ["application/pdf"];
const DOCX_MIME = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const AUDIO_MIME = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/x-m4a", "audio/mp4"];
const VIDEO_MIME = ["video/mp4", "video/webm"];
const PPTX_MIME = ["application/vnd.openxmlformats-officedocument.presentationml.presentation"];

/** The summary request's opening, with the topic the student gave. */
export function summaryPreamble(topic?: string): string {
  const topicHint = topic?.trim() ? `მომხმარებლის მითითებული თემა/კონტექსტი: ${topic.trim()}` : "";
  return ["გააანალიზე შემდეგი სასწავლო მასალა და შექმენი სტრუქტურირებული კონსპექტი Markdown ფორმატში.", topicHint]
    .filter(Boolean)
    .join("\n");
}

export const PPTX_NO_TEXT_ERROR = "ამ პრეზენტაციაში ტექსტი ვერ ვიპოვე. სცადე PDF ან ჩასვი ტექსტი.";

export async function buildUserMessage(
  inputType: InputType,
  options: {
    file?: File | null;
    text?: string;
    youtubeTranscript?: string;
    topic?: string;
    cardCount?: number;
    difficulty?: Difficulty | null;
    /** A later part of a big deck: questions the first part already asked. */
    avoidQuestions?: string[];
    mode?: GenerationMode;
  },
): Promise<UserModelMessage> {
  const { file, text, youtubeTranscript, topic, cardCount, difficulty, avoidQuestions = [], mode = "flashcards" } =
    options;

  const topicHint = topic?.trim()
    ? `მომხმარებლის მითითებული თემა/კონტექსტი: ${topic.trim()}`
    : "";

  const preamble =
    mode === "summary"
      ? summaryPreamble(topic)
      : [
          "გააანალიზე შემდეგი სასწავლო მასალა და შექმენი ფლეშბარათები.",
          cardCount
            ? `შექმენი ზუსტად ${cardCount} ფლეშბარათი, არც მეტი და არც ნაკლები.`
            : "შექმენი 10-15 ფლეშბარათი.",
          difficulty ? DIFFICULTY_HINT[difficulty] : "",
          avoidQuestions.length
            ? `ეს კითხვები უკვე შექმნილია, არ გაიმეორო და სხვა დეტალებზე ჰკითხე:\n${avoidQuestions.map((q) => `- ${q}`).join("\n")}`
            : "",
          topicHint,
        ]
          .filter(Boolean)
          .join("\n");

  if (inputType === "text" && text) {
    return {
      role: "user",
      content: `${preamble}\n\n--- მასალა ---\n${text}`,
    };
  }

  if (inputType === "presentation") {
    const slides = file ? await extractPptxText(Buffer.from(await file.arrayBuffer())) : (text ?? "");
    if (!slides.trim()) throw new GenerationInputError(PPTX_NO_TEXT_ERROR);
    return {
      role: "user",
      content: `${preamble}\nმასალა პრეზენტაციაა: გამოიყენე სლაიდების ტექსტიც და შენიშვნებიც.\n\n--- პრეზენტაცია ---\n${slides}`,
    };
  }

  if (inputType === "youtube" && youtubeTranscript) {
    return {
      role: "user",
      content: `${preamble}\n\n--- YouTube ვიდეოს ტრანსკრიპტი ---\n${youtubeTranscript}`,
    };
  }

  if (!file) {
    throw new Error("ფაილი არ არის მოწოდებული");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";

  if (PPTX_MIME.includes(mimeType) || file.name.toLowerCase().endsWith(".pptx")) {
    const slides = await extractPptxText(buffer);
    if (!slides.trim()) throw new GenerationInputError(PPTX_NO_TEXT_ERROR);
    return { role: "user", content: `${preamble}\n\n--- პრეზენტაცია ---\n${slides}` };
  }

  if (TEXT_MIME.includes(mimeType) || file.name.endsWith(".txt")) {
    const fileText = buffer.toString("utf-8");
    return {
      role: "user",
      content: `${preamble}\n\n--- ტექსტური ფაილი ---\n${fileText}`,
    };
  }

  if (DOCX_MIME.includes(mimeType) || file.name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return {
      role: "user",
      content: `${preamble}\n\n--- DOCX დოკუმენტი ---\n${result.value}`,
    };
  }

  if (IMAGE_MIME.includes(mimeType)) {
    return {
      role: "user",
      content: [
        { type: "text", text: preamble },
        { type: "image", image: buffer, mediaType: mimeType },
      ],
    };
  }

  if (PDF_MIME.includes(mimeType)) {
    return {
      role: "user",
      content: [
        { type: "text", text: preamble },
        { type: "file", data: buffer, mediaType: "application/pdf" },
      ],
    };
  }

  if (AUDIO_MIME.includes(mimeType) || inputType === "audio") {
    return {
      role: "user",
      content: [
        {
          type: "text",
          text: `${preamble}\n\nგაანალიზე ეს აუდიო ფაილი, ტრანსკრიბირე საჭიროებისამებრ და დაამუშავე მასალა.`,
        },
        { type: "file", data: buffer, mediaType: mimeType },
      ],
    };
  }

  if (VIDEO_MIME.includes(mimeType) || inputType === "video") {
    return {
      role: "user",
      content: [
        {
          type: "text",
          text: `${preamble}\n\nგაანალიზე ეს ვიდეო ფაილი და დაამუშავე მასალა მისი შინაარსის მიხედვით.`,
        },
        { type: "file", data: buffer, mediaType: mimeType },
      ],
    };
  }

  // Fallback: try as text
  const fallbackText = buffer.toString("utf-8");
  if (fallbackText.length > 50) {
    return {
      role: "user",
      content: `${preamble}\n\n--- ფაილის შიგთავსი ---\n${fallbackText.slice(0, 50000)}`,
    };
  }

  throw new Error(`მხარდაუჭერელი ფაილის ტიპი: ${mimeType}`);
}
