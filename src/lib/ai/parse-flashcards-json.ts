import { generatedFlashcardsSchema, type GeneratedFlashcards } from "./schemas";

export const FLASHCARD_JSON_OUTPUT_RULE = `
8. დააბრუნე მხოლოდ სწორი JSON ობიექტი, markdown-ის გარეშე, ამ სტრუქტურით:
{"deckTitle":"...","deckDescription":"...","cards":[{"question":"...","answer":"..."}]}`;

export interface FlashcardDraft {
  question: string;
  answer: string;
}

export interface IncrementalFlashcardsParse {
  deckTitle?: string;
  deckDescription?: string;
  cards: FlashcardDraft[];
  isComplete: boolean;
}

export function stripCodeFences(text: string): string {
  let out = text.trim();
  const fenced = out.match(/```(?:json|markdown|md)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  out = out.replace(/^```(?:json|markdown|md)?\s*\n?/i, "");
  out = out.replace(/\n?```\s*$/i, "");
  return out.trim();
}

export function sanitizeStreamMarkdown(text: string): string {
  return stripCodeFences(text)
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n");
}

function extractQuotedField(source: string, field: string): string | undefined {
  const re = new RegExp(`"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, "i");
  const match = source.match(re);
  if (!match?.[1]) return undefined;
  try {
    return JSON.parse(`"${match[1]}"`) as string;
  } catch {
    return match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
}

function extractCompleteCardObjects(source: string): FlashcardDraft[] {
  const cards: FlashcardDraft[] = [];
  const marker = '"question"';
  let searchFrom = 0;

  while (searchFrom < source.length) {
    const questionIdx = source.indexOf(marker, searchFrom);
    if (questionIdx === -1) break;

    const braceStart = source.lastIndexOf("{", questionIdx);
    if (braceStart === -1) break;

    let depth = 0;
    let braceEnd = -1;
    for (let i = braceStart; i < source.length; i += 1) {
      const char = source[i];
      if (char === "{") depth += 1;
      if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          braceEnd = i;
          break;
        }
      }
    }

    if (braceEnd === -1) break;

    const slice = source.slice(braceStart, braceEnd + 1);
    try {
      const parsed = JSON.parse(slice) as { question?: unknown; answer?: unknown };
      if (
        typeof parsed.question === "string" &&
        typeof parsed.answer === "string" &&
        parsed.question.trim() &&
        parsed.answer.trim()
      ) {
        cards.push({
          question: parsed.question.trim(),
          answer: parsed.answer.trim(),
        });
      }
    } catch {
      // incomplete or malformed object — wait for more tokens
    }

    searchFrom = braceEnd + 1;
  }

  const seen = new Set<string>();
  return cards.filter((card) => {
    const key = card.question.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function repairJsonPayload(raw: string): string {
  let text = stripCodeFences(raw);
  const objectStart = text.indexOf("{");
  const arrayStart = text.indexOf("[");

  if (objectStart === -1 && arrayStart !== -1) {
    text = `{"deckTitle":"AI ფლეშბარათები","deckDescription":"","cards":${text}`;
  } else if (objectStart > 0) {
    text = text.slice(objectStart);
  }

  if (!text.includes('"cards"') && arrayStart !== -1) {
    const cardsSlice = text.slice(arrayStart);
    text = `{"deckTitle":"AI ფლეშბარათები","deckDescription":"","cards":${cardsSlice}`;
  }

  const openBraces = (text.match(/\{/g) ?? []).length;
  const closeBraces = (text.match(/\}/g) ?? []).length;
  const openBrackets = (text.match(/\[/g) ?? []).length;
  const closeBrackets = (text.match(/\]/g) ?? []).length;

  for (let i = 0; i < openBrackets - closeBrackets; i += 1) {
    text += "]";
  }
  for (let i = 0; i < openBraces - closeBraces; i += 1) {
    text += "}";
  }

  return text.trim();
}

export function parseFlashcardsIncremental(raw: string): IncrementalFlashcardsParse {
  const cleaned = stripCodeFences(raw);
  const cards = extractCompleteCardObjects(cleaned);

  let isComplete = false;
  try {
    parseGeneratedFlashcardsJson(raw);
    isComplete = true;
  } catch {
    isComplete = false;
  }

  return {
    deckTitle: extractQuotedField(cleaned, "deckTitle"),
    deckDescription: extractQuotedField(cleaned, "deckDescription"),
    cards,
    isComplete,
  };
}

export function parseGeneratedFlashcardsJson(text: string): GeneratedFlashcards {
  const attempts = [
    stripCodeFences(text),
    repairJsonPayload(text),
  ];

  let lastError: unknown;

  for (const candidate of attempts) {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end <= start) continue;

    try {
      const parsed = JSON.parse(candidate.slice(start, end + 1)) as unknown;
      return generatedFlashcardsSchema.parse(parsed);
    } catch (error) {
      lastError = error;
    }
  }

  const incremental = parseFlashcardsIncremental(text);
  if (incremental.cards.length >= 5) {
    return generatedFlashcardsSchema.parse({
      deckTitle: incremental.deckTitle || "AI ფლეშბარათები",
      deckDescription: incremental.deckDescription || "",
      cards: incremental.cards,
    });
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("AI-ის პასუხი ვერ გაიშიფრა. სცადე თავიდან.");
}

export function previewStreamText(text: string, max = 480): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}…`;
}
