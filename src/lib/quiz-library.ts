/**
 * Saved quizzes and every pass through them, for „ჩემი მასალები“. Both live
 * on the account (lib/user-data → user_data, per-user RLS); localStorage is
 * the copy the pages read. A quiz is saved when generation starts (status
 * „generating“) so a closed tab can still pick it up (lib/generation-jobs).
 */
import { userStore } from "./user-data";
import { QUIZ_ATTEMPTS_KEY, QUIZ_ATTEMPTS_LIMIT, QUIZZES_KEY, QUIZZES_UPDATED_EVENT } from "./user-data-keys";
import { createQuizRun, isQuizOver, quizTotals, type QuizRunState } from "./quiz-run";
import type { DeckStatus } from "./types";

export { QUIZZES_UPDATED_EVENT };

export interface QuizQuestion {
  id: number;
  questionText: string;
  options: [string, string, string, string];
  correctAnswerIndex: number;
  explanation: string;
}

export interface SavedQuiz {
  id: string;
  title: string;
  /** Quizzes are made from a file (PDF, TXT, MD). */
  sourceType: "file";
  sourceName: string;
  questionCount: number;
  questions: QuizQuestion[];
  status: DeckStatus;
  error?: string;
  /** The server's copy while it's being made (lib/generation-jobs). */
  jobId?: string;
  /** ms */
  createdAt: number;
  updatedAt: number;
  lastOpenedAt?: number;
  /** Deleted (kept, empty, so another device's copy doesn't bring it back). */
  deletedAt?: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  /** The whole pass (lib/quiz-run): order, results, choices. */
  run: QuizRunState;
  /** Only these questions (a „შეცდომები“ attempt). */
  only?: number[];
  /** The option chosen per question (null: not answered). */
  answers: (number | null)[];
  /** The turn being answered. */
  currentIndex: number;
  /** Right on the first try, of the questions in this attempt. */
  score: number;
  startedAt: number;
  /** null: not finished. */
  finishedAt: number | null;
  updatedAt: number;
}

const TOMBSTONE_DAYS = 60;

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const value = userStore.get<unknown>(key, []);
  return Array.isArray(value) ? (value as T[]) : [];
}

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(QUIZZES_UPDATED_EVENT));
}

function writeQuizzes(quizzes: SavedQuiz[], now: number): void {
  const cutoff = now - TOMBSTONE_DAYS * 86_400_000;
  userStore.set(QUIZZES_KEY, quizzes.filter((quiz) => !quiz.deletedAt || quiz.deletedAt > cutoff));
  notify();
}

export function getQuizzes(): SavedQuiz[] {
  return readList<SavedQuiz>(QUIZZES_KEY).filter((quiz) => !quiz.deletedAt);
}

export function getQuiz(id: string): SavedQuiz | undefined {
  return getQuizzes().find((quiz) => quiz.id === id);
}

export function saveQuiz(quiz: SavedQuiz, now: number = Date.now()): void {
  const rest = readList<SavedQuiz>(QUIZZES_KEY).filter((item) => item.id !== quiz.id);
  writeQuizzes([{ ...quiz, updatedAt: now }, ...rest], now);
}

export function updateQuiz(id: string, patch: Partial<SavedQuiz>, now: number = Date.now()): SavedQuiz | undefined {
  let updated: SavedQuiz | undefined;
  const quizzes = readList<SavedQuiz>(QUIZZES_KEY).map((quiz) => {
    if (quiz.id !== id || quiz.deletedAt) return quiz;
    updated = { ...quiz, ...patch, updatedAt: now };
    return updated;
  });
  if (updated) writeQuizzes(quizzes, now);
  return updated;
}

export function renameQuiz(id: string, title: string): void {
  const next = title.trim();
  if (next) updateQuiz(id, { title: next });
}

export function markQuizOpened(id: string, now: number = Date.now()): void {
  updateQuiz(id, { lastOpenedAt: now }, now);
}

/** The quiz and its attempts, everywhere. */
export function deleteQuiz(id: string, now: number = Date.now()): void {
  const quizzes = readList<SavedQuiz>(QUIZZES_KEY).map((quiz): SavedQuiz =>
    quiz.id === id ? { ...quiz, questions: [], deletedAt: now, updatedAt: now } : quiz,
  );
  writeQuizzes(quizzes, now);
  userStore.set(
    QUIZ_ATTEMPTS_KEY,
    readList<QuizAttempt>(QUIZ_ATTEMPTS_KEY).filter((attempt) => attempt.quizId !== id),
  );
}

/** A new, empty quiz record for a generation that's starting. */
export function newQuizRecord(sourceName: string, questionCount: number, now: number = Date.now()): SavedQuiz {
  const id = `quiz-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    title: sourceName || "ქვიზი",
    sourceType: "file",
    sourceName,
    questionCount,
    questions: [],
    status: "generating",
    jobId: id,
    createdAt: now,
    updatedAt: now,
  };
}

/* --- Attempts ------------------------------------------------------------- */

export function getAttempts(quizId?: string): QuizAttempt[] {
  const all = readList<QuizAttempt>(QUIZ_ATTEMPTS_KEY);
  return (quizId ? all.filter((attempt) => attempt.quizId === quizId) : all).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function latestAttempt(quizId: string): QuizAttempt | undefined {
  return getAttempts(quizId)[0];
}

/** The last attempt that isn't finished, to carry on with. */
export function unfinishedAttempt(quizId: string): QuizAttempt | undefined {
  const latest = latestAttempt(quizId);
  return latest && latest.finishedAt === null ? latest : undefined;
}

export function startAttempt(quizId: string, questionCount: number, only?: number[], now: number = Date.now()): QuizAttempt {
  return attemptFromRun(
    {
      id: `attempt-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      quizId,
      ...(only ? { only } : {}),
      startedAt: now,
    },
    createQuizRun(questionCount, only),
    now,
  );
}

/** The attempt as it stands after `run`: answers, position, score, finished. */
export function attemptFromRun(
  attempt: Pick<QuizAttempt, "id" | "quizId" | "startedAt" | "only"> & Partial<QuizAttempt>,
  run: QuizRunState,
  now: number = Date.now(),
): QuizAttempt {
  const over = isQuizOver(run) && run.turns.length > 0;
  const inAttempt = attempt.only ?? run.firstTry.map((_, index) => index);
  return {
    id: attempt.id,
    quizId: attempt.quizId,
    ...(attempt.only ? { only: attempt.only } : {}),
    run,
    answers: run.chosen,
    currentIndex: run.position,
    score: inAttempt.filter((index) => run.firstTry[index] === true).length,
    startedAt: attempt.startedAt,
    finishedAt: over ? (attempt.finishedAt ?? now) : null,
    updatedAt: now,
  };
}

export function saveAttempt(attempt: QuizAttempt): void {
  const rest = readList<QuizAttempt>(QUIZ_ATTEMPTS_KEY).filter((item) => item.id !== attempt.id);
  userStore.set(
    QUIZ_ATTEMPTS_KEY,
    [attempt, ...rest].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, QUIZ_ATTEMPTS_LIMIT),
  );
  notify();
}

/** Right answers of a whole quiz, for „{სწორი} / {N} სწორი“ (all questions, first try). */
export function attemptTotals(attempt: QuizAttempt): { correct: number; total: number } {
  const totals = quizTotals(attempt.run);
  return { correct: totals.firstTry, total: totals.total };
}
