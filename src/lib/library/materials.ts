/**
 * „ჩემი მასალები“ as plain data: every deck, quiz and conspectus as one
 * list item with its progress, plus the filters, sorting and the „continue
 * where you stopped“ picks. Pure, so the lists are testable; the pages read
 * the stores (lib/custom-decks, lib/quiz-library, lib/conspectus-storage,
 * lib/flashcard-session) and pass them in.
 */
import type { Conspectus } from "@/lib/conspectus-storage";
import type { FlashcardSession } from "@/lib/flashcard-session";
import type { QuizAttempt, SavedQuiz } from "@/lib/quiz-library";
import type { Deck, DeckStatus } from "@/lib/types";
import type { TaskHelper } from "@/lib/task-helper-store";

export type MaterialKind = "deck" | "quiz" | "conspectus" | "task";
export type MaterialSource = "file" | "youtube" | "presentation" | "audio" | "video" | "text";

export interface MaterialItem {
  key: string;
  kind: MaterialKind;
  id: string;
  title: string;
  source: MaterialSource;
  sourceName: string;
  status: DeckStatus;
  createdAt: number;
  /** When it was last opened, else when it was made: for „ბოლოს გახსნილი“. */
  openedAt: number;
  /** Started and not finished. */
  unfinished: boolean;
  /** Decks: every card known. Quizzes: finished. */
  done: boolean;
  deck?: { cards: number; target: number; known: number; unknown: number; started: boolean };
  quiz?: {
    questions: number;
    /** Questions answered in the last attempt. */
    answered: number;
    /** The last attempt: right on the first try, of all the questions. */
    correct: number;
    finished: boolean;
    attempts: number;
    mistakes: boolean;
  };
  /** Conspectus: the first lines, without markdown. */
  excerpt?: string;
  /** An assignment (the task helper): steps done of all, and when it's due. */
  task?: { done: number; steps: number; dueDate?: string };
}

const SOURCES: MaterialSource[] = ["file", "youtube", "presentation", "audio", "video", "text"];

function sourceOf(value: unknown, label?: string): MaterialSource {
  if (typeof value === "string" && (SOURCES as string[]).includes(value)) return value as MaterialSource;
  if (label?.startsWith("YouTube")) return "youtube";
  if (label?.startsWith("პრეზენტაცია")) return "presentation";
  return label && /\.[a-z0-9]{2,4}$/i.test(label) ? "file" : "text";
}

const stripSourcePrefix = (label = "") => label.replace(/^(პრეზენტაცია|YouTube):\s*/, "");

export function deckItem(deck: Deck, session: FlashcardSession | null): MaterialItem {
  let known = 0;
  let unknown = 0;
  if (session) {
    for (const card of deck.cards) {
      if (session.status[card.id] === "known") known += 1;
      else if (session.status[card.id] === "unknown") unknown += 1;
    }
  }
  const status = deck.status ?? "ready";
  const started = known + unknown > 0;
  const done = status === "ready" && deck.cards.length > 0 && known === deck.cards.length;
  // Older decks have no date: their id holds when they were made.
  const createdAt = deck.createdAt ?? (Number(deck.id.replace(/\D+/g, "").slice(0, 13)) || 0);
  return {
    key: `deck:${deck.id}`,
    kind: "deck",
    id: deck.id,
    title: deck.title,
    source: sourceOf(deck.sourceType, deck.source),
    sourceName: deck.sourceName || stripSourcePrefix(deck.source),
    status,
    createdAt,
    openedAt: deck.lastOpenedAt ?? createdAt,
    unfinished: status === "ready" && started && !done,
    done,
    deck: { cards: deck.cards.length, target: deck.cardTarget ?? deck.cards.length, known, unknown, started },
  };
}

/** Questions answered wrongly on the first try: what „შეცდომები“ goes over again. */
export function firstTryMistakes(firstTry: (boolean | null)[]): number[] {
  return firstTry.flatMap((result, index) => (result === false ? [index] : []));
}

export function quizItem(quiz: SavedQuiz, attempts: QuizAttempt[]): MaterialItem {
  const mine = attempts.filter((attempt) => attempt.quizId === quiz.id).sort((a, b) => b.updatedAt - a.updatedAt);
  const last = mine[0];
  const answered = last ? last.answers.filter((answer) => answer !== null).length : 0;
  const finished = Boolean(last?.finishedAt);
  const correct = last ? last.run.firstTry.filter((result) => result === true).length : 0;
  return {
    key: `quiz:${quiz.id}`,
    kind: "quiz",
    id: quiz.id,
    title: quiz.title,
    source: "file",
    sourceName: quiz.sourceName,
    status: quiz.status,
    createdAt: quiz.createdAt,
    openedAt: quiz.lastOpenedAt ?? quiz.createdAt,
    unfinished: quiz.status === "ready" && Boolean(last) && !finished,
    done: finished,
    quiz: {
      questions: quiz.questions.length || quiz.questionCount,
      answered,
      correct,
      finished,
      attempts: mine.length,
      mistakes: Boolean(last && finished && firstTryMistakes(last.run.firstTry).length > 0),
    },
  };
}

/** The first two lines of a conspectus, as plain text. */
export function excerptOf(markdown: string, title = ""): string {
  const lines = markdown
    .split("\n")
    .map((line) => line.replace(/^#+\s*|^[-*>]\s+|\*\*|__|`/g, "").trim())
    .filter((line) => line && line !== title.trim());
  return lines.slice(0, 2).join(" ");
}

export function conspectusItem(conspectus: Conspectus): MaterialItem {
  return {
    key: `conspectus:${conspectus.id}`,
    kind: "conspectus",
    id: conspectus.id,
    title: conspectus.title,
    source: sourceOf(conspectus.sourceType, conspectus.sourceLabel),
    sourceName: stripSourcePrefix(conspectus.sourceLabel),
    status: conspectus.status ?? "ready",
    createdAt: conspectus.createdAt,
    openedAt: conspectus.lastOpenedAt ?? conspectus.createdAt,
    unfinished: false,
    done: false,
    excerpt: excerptOf(conspectus.content, conspectus.title),
  };
}

/** An assignment from the task helper: started once a step is ticked, done when all are. */
export function taskItem(task: TaskHelper): MaterialItem {
  const steps = task.result.steps?.length ?? 0;
  const done = task.doneSteps.filter((index) => index < steps).length;
  return {
    key: `task:${task.id}`,
    kind: "task",
    id: task.id,
    title: task.title,
    source: task.fileName ? sourceOf(undefined, task.fileName) : "text",
    sourceName: task.subjectName ?? task.fileName ?? "",
    status: "ready",
    createdAt: task.createdAt,
    openedAt: task.lastOpenedAt ?? task.createdAt,
    unfinished: steps > 0 && done > 0 && done < steps,
    done: steps > 0 && done === steps,
    task: { done, steps, ...(task.dueDate ? { dueDate: task.dueDate } : {}) },
  };
}

export type MaterialFilter = "all" | "unfinished" | "done";
export type MaterialSort = "opened" | "newest";

export function filterMaterials(items: MaterialItem[], { query = "", filter = "all" }: { query?: string; filter?: MaterialFilter }): MaterialItem[] {
  const needle = query.trim().toLowerCase();
  return items.filter((item) => {
    if (filter === "unfinished" && !item.unfinished) return false;
    if (filter === "done" && !item.done) return false;
    if (!needle) return true;
    return `${item.title} ${item.sourceName}`.toLowerCase().includes(needle);
  });
}

/** Generating ones first (they're what was just asked for), then by the sort. */
export function sortMaterials(items: MaterialItem[], sort: MaterialSort): MaterialItem[] {
  const field = sort === "opened" ? "openedAt" : "createdAt";
  return [...items].sort(
    (a, b) => Number(b.status === "generating") - Number(a.status === "generating") || b[field] - a[field],
  );
}

/** The one to offer „გაგრძელება“ for: the most recently opened unfinished item. */
export function resumeCandidate(items: MaterialItem[]): MaterialItem | null {
  return sortMaterials(items.filter((item) => item.unfinished), "opened")[0] ?? null;
}

/** The dashboard's „continue where you stopped“: unfinished first, else the newest; at most `limit`. */
export function continueItems(items: MaterialItem[], limit = 3): MaterialItem[] {
  const unfinished = sortMaterials(items.filter((item) => item.unfinished), "opened");
  if (unfinished.length > 0) return unfinished.slice(0, limit);
  return sortMaterials(items.filter((item) => item.status === "ready"), "newest").slice(0, limit);
}

/** Where an item opens. */
export function materialHref(item: MaterialItem, mode?: "restart" | "mistakes"): string {
  if (item.kind === "deck") return `/deck/${item.id}`;
  if (item.kind === "conspectus") return `/conspectus/${item.id}`;
  if (item.kind === "task") return `/task-helper?id=${encodeURIComponent(item.id)}`;
  return `/quiz?quiz=${encodeURIComponent(item.id)}${mode ? `&mode=${mode}` : ""}`;
}

/** The deck's questions and answers as one text, for the quiz generator („ქვიზად გადაქცევა“). */
export function deckAsQuizText(deck: Deck): string {
  return deck.cards.map((card, index) => `${index + 1}. ${card.question}\nპასუხი: ${card.answer}`).join("\n\n");
}
