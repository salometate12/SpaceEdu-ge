import mammoth from "mammoth";
import type { UserModelMessage } from "ai";

export type InputType = "file" | "audio" | "video" | "youtube" | "text";
export type GenerationMode = "flashcards" | "summary";

const TEXT_MIME = ["text/plain"];
const IMAGE_MIME = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const PDF_MIME = ["application/pdf"];
const DOCX_MIME = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const AUDIO_MIME = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-m4a", "audio/mp4"];
const VIDEO_MIME = ["video/mp4", "video/webm"];

export async function buildUserMessage(
  inputType: InputType,
  options: {
    file?: File | null;
    text?: string;
    youtubeTranscript?: string;
    topic?: string;
    cardCount?: number;
    mode?: GenerationMode;
  },
): Promise<UserModelMessage> {
  const { file, text, youtubeTranscript, topic, cardCount, mode = "flashcards" } =
    options;

  const topicHint = topic?.trim()
    ? `მომხმარებლის მითითებული თემა/კონტექსტი: ${topic.trim()}`
    : "";

  const preamble =
    mode === "summary"
      ? [
          "გააანალიზე შემდეგი სასწავლო მასალა და შექმენი სტრუქტურირებული კონსპექტი Markdown ფორმატში.",
          topicHint,
        ]
          .filter(Boolean)
          .join("\n")
      : [
          "გააანალიზე შემდეგი სასწავლო მასალა და შექმენი ფლეშბარათები.",
          cardCount
            ? `შექმენი დაახლოებით ${cardCount} ფლეშბარათი.`
            : "შექმენი 10-15 ფლეშბარათი.",
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
