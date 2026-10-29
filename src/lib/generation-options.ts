import { z } from "zod";

/** How many flashcards one request may ask for. */
export const CARD_COUNT_MIN = 5;
export const CARD_COUNT_MAX = 50;
export const CARD_COUNT_DEFAULT = 20;
export const CARD_COUNT_PRESETS = [10, 20, 30, 50] as const;

export type Difficulty = "easy" | "medium" | "hard";
export const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: "easy", label: "მარტივი" },
  { id: "medium", label: "საშუალო" },
  { id: "hard", label: "რთული" },
];

/** The most cards one model answer reliably gives; bigger decks are asked for in parts. */
export const CARD_COUNT_PER_REQUEST = 25;

/** 50 → [25, 25], 33 → [17, 16], 20 → [20]: parts of at most 25, as even as possible. */
export function splitCardCount(total: number): number[] {
  const parts = Math.ceil(total / CARD_COUNT_PER_REQUEST);
  const base = Math.floor(total / parts);
  return Array.from({ length: parts }, (_, index) => base + (index < total % parts ? 1 : 0));
}

/** The questions a later part must not repeat, as sent in the form (at most 50, each cut to 200 characters). */
export function parseAvoidQuestions(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .slice(0, 50)
      .map((item) => item.trim().slice(0, 200));
  } catch {
    return [];
  }
}

/** A count typed by hand, kept inside 5–50 (a blank or broken value goes back to the default). */
export function clampCardCount(value: number): number {
  if (!Number.isFinite(value)) return CARD_COUNT_DEFAULT;
  return Math.min(CARD_COUNT_MAX, Math.max(CARD_COUNT_MIN, Math.round(value)));
}

/** A request the server refuses before any AI call: answered with 400 and this Georgian message. */
export class GenerationInputError extends Error {}

export const cardCountSchema = z.coerce
  .number({ error: "ბარათების რაოდენობა რიცხვი უნდა იყოს." })
  .int({ error: "ბარათების რაოდენობა მთელი რიცხვი უნდა იყოს." })
  .min(CARD_COUNT_MIN, { error: `ბარათები მინიმუმ ${CARD_COUNT_MIN} უნდა იყოს.` })
  .max(CARD_COUNT_MAX, { error: `ერთ ჯერზე მაქსიმუმ ${CARD_COUNT_MAX} ბარათის შექმნა შეიძლება.` });

/** The form's card count: missing means the old default; anything else must be 5–50. */
export function parseCardCount(raw: FormDataEntryValue | null): number {
  if (raw === null || raw === "") return CARD_COUNT_DEFAULT;
  const result = cardCountSchema.safeParse(raw);
  if (!result.success) throw new GenerationInputError(result.error.issues[0]?.message ?? "ბარათების რაოდენობა არასწორია.");
  return result.data;
}

export function parseDifficulty(raw: FormDataEntryValue | null): Difficulty | null {
  return raw === "easy" || raw === "medium" || raw === "hard" ? raw : null;
}

export const DIFFICULTY_HINT: Record<Difficulty, string> = {
  easy: "სირთულე: მარტივი. კითხვები ძირითად ცნებებსა და განმარტებებზე, მოკლე პასუხებით.",
  medium: "სირთულე: საშუალო. ცნებები, მიზეზები და კავშირები; პასუხები ორ სამ წინადადებამდე.",
  hard: "სირთულე: რთული. გამოყენება, შედარება და დასკვნა; კითხვები, რომლებსაც გააზრება სჭირდება.",
};

/** „12:30“ or „1:02:05“ → seconds; null when it isn't a time. */
export function parseClock(value: string): number | null {
  const parts = value.trim().split(":");
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !/^\d{1,2}$/.test(part))) return null;
  const numbers = parts.map(Number);
  if (numbers.slice(1).some((n) => n >= 60)) return null;
  return numbers.reduce((total, n) => total * 60 + n, 0);
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export interface TimedSegment {
  text: string;
  /** Start, in the unit the transcript uses. */
  offset: number;
}

/**
 * The transcript of the part from `start` to `end` seconds. Transcripts come
 * with offsets in seconds or in milliseconds depending on the format; a last
 * offset beyond six hours in seconds can only be milliseconds.
 */
export function sliceTranscript(segments: TimedSegment[], start: number, end: number): string {
  const last = segments.reduce((max, segment) => Math.max(max, segment.offset), 0);
  const toSeconds = last > 6 * 3600 ? (offset: number) => offset / 1000 : (offset: number) => offset;
  return segments
    .filter((segment) => {
      const at = toSeconds(segment.offset);
      return at >= start && at < end;
    })
    .map((segment) => segment.text)
    .join(" ")
    .trim();
}
