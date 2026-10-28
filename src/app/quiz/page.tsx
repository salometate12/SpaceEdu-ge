"use client";

import { logActivity } from "@/lib/activity-log";
import { ArrowRight, FileText, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { QuizGenerating } from "@/components/Quiz/QuizGenerating";
import { UploadIconBadge } from "@/components/ui/UploadDropzone";
import {
  QUIZ_COLUMN,
  QUIZ_FOCUS_RING,
  QUIZ_PRIMARY_BUTTON,
  QuizBackLink,
  QuizResults,
  QuizRun,
} from "@/components/Quiz/QuizRun";
import { setDockHidden } from "@/lib/mobile-overlay";
import { recordDailyActivity } from "@/lib/daily-streak";
import { recordQuizResult } from "@/lib/dashboard-metrics";
import { getActiveSubject } from "@/lib/activity";
import { takeHandoff } from "@/lib/tool-handoff";
import {
  answerTurn,
  createQuizRun,
  currentTurn,
  isQuizOver,
  nextTurn,
  questionsToRepeat,
  quizTotals,
  type QuizRunState,
} from "@/lib/quiz-run";
import "./quiz-theme.css";

export interface QuizQuestion {
  id: number;
  questionText: string;
  options: [string, string, string, string];
  correctAnswerIndex: number;
  explanation: string;
}

interface QuizApiResponse {
  questions: QuizQuestion[];
}

type Phase = "input" | "loading" | "failed" | "active" | "results";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20];
// What /api/quiz accepts.
const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 25;
const GENERATION_ERROR = "AI ახლა გადატვირთულია, სცადე ცოტა ხანში.";

export default function QuizPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  // Opened from a journal entry („ქვიზი ამ ჩანაწერიდან“): the entry as a text file.
  useEffect(() => {
    void Promise.resolve().then(() => {
      const handed = takeHandoff("quiz");
      if (!handed) return;
      const name = `${(handed.title || "ჩანაწერი").replace(/[\\/:*?"<>|]+/g, " ").trim()}.txt`;
      setFile(new File([handed.text], name, { type: "text/plain" }));
    });
  }, []);
  const [isDragActive, setIsDragActive] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [isCustomCount, setIsCustomCount] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  // The order of questions (mistakes come back once), results, choices: quiz-run.ts.
  const [run, setRun] = useState<QuizRunState>(() => createQuizRun(0));
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null,
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  // A run over only the mistakes: not recorded again in the statistics.
  const [repeatingMistakes, setRepeatingMistakes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Generation failed: shown in the generating card with „ხელახლა ცდა“.
  const [generationError, setGenerationError] = useState<string | null>(null);

  const phase: Phase = useMemo(() => {
    if (isLoading) return "loading";
    if (generationError) return "failed";
    if (questions.length === 0) return "input";
    if (isQuizOver(run)) return "results";
    return "active";
  }, [isLoading, generationError, questions.length, run]);

  // Phones: the main button is pinned to the bottom on the upload and
  // generating screens too (the run hides the dock itself).
  const pinnedBottom = phase === "input" || phase === "loading" || phase === "failed";
  useEffect(() => {
    setDockHidden("quiz-upload", pinnedBottom);
    return () => setDockHidden("quiz-upload", false);
  }, [pinnedBottom]);

  const turn = currentTurn(run);
  const currentQuestion = turn ? questions[turn.question] : undefined;

  const applyFile = (nextFile: File) => {
    const lower = nextFile.name.toLowerCase();
    const isPdf = nextFile.type === "application/pdf" || lower.endsWith(".pdf");
    const isText =
      nextFile.type.startsWith("text/") || lower.endsWith(".txt") || lower.endsWith(".md");

    if (!isPdf && !isText) {
      setError("მხოლოდ PDF, TXT ან MD ფორმატის ფაილია დაშვებული.");
      return;
    }

    setError(null);
    setFile(nextFile);
  };

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (nextFile) applyFile(nextFile);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) applyFile(dropped);
  };

  const handleQuizGeneration = async () => {
    if (!file) {
      setError("გთხოვ, ჯერ აირჩიე ფაილი.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGenerationError(null);
    setQuestions([]);
    setRun(createQuizRun(0));
    setSelectedOptionIndex(null);
    setIsSubmitted(false);

    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("questionCount", String(questionCount));

      const response = await fetch("/api/quiz", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as
        | QuizApiResponse
        | { error?: string | boolean; message?: string };

      if (!response.ok) {
        // Only a real message: some errors come back as `{ error: true }`.
        const message =
          "message" in data && typeof data.message === "string" && data.message
            ? data.message
            : "error" in data && typeof data.error === "string" && data.error
              ? data.error
              : GENERATION_ERROR;
        throw new Error(message);
      }

      const generated = (data as QuizApiResponse).questions;
      setQuestions(generated);
      setRun(createQuizRun(generated.length));
    } catch (err) {
      setGenerationError(err instanceof Error && err.message ? err.message : GENERATION_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAnswer = () => {
    if (selectedOptionIndex === null || !currentQuestion || isSubmitted) return;

    setRun((prev) => answerTurn(prev, selectedOptionIndex, currentQuestion.correctAnswerIndex));
    setIsSubmitted(true);
  };

  const goNext = () => {
    const next = nextTurn(run);
    // The statistics count first tries; repeats are for learning.
    if (isQuizOver(next) && !repeatingMistakes) {
      recordDailyActivity();
      recordQuizResult(quizTotals(next).firstTry, questions.length, getActiveSubject());
      logActivity({
        type: "quiz_completed",
        tool: "quiz",
        subject: getActiveSubject(),
        value: questions.length ? Math.round((quizTotals(next).firstTry / questions.length) * 100) : null,
        meta: { questions: questions.length },
      });
    }
    setRun(next);
    setSelectedOptionIndex(null);
    setIsSubmitted(false);
  };

  const repeatMistakes = () => {
    setRun(createQuizRun(questions.length, questionsToRepeat(run)));
    setRepeatingMistakes(true);
    setSelectedOptionIndex(null);
    setIsSubmitted(false);
  };

  const restart = () => {
    setFile(null);
    setQuestions([]);
    setRun(createQuizRun(0));
    setRepeatingMistakes(false);
    setSelectedOptionIndex(null);
    setIsSubmitted(false);
    setError(null);
    setGenerationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sourceName = file ? file.name.replace(/\.[^.]+$/, "") : "";

  if (phase === "results") {
    return (
      <QuizResults
        questions={questions}
        run={run}
        sourceName={sourceName}
        onRepeatMistakes={repeatMistakes}
        onNewQuiz={restart}
        repeatRun={repeatingMistakes}
      />
    );
  }

  if (phase === "active" && currentQuestion) {
    return (
      <QuizRun
        question={currentQuestion}
        run={run}
        selected={selectedOptionIndex}
        submitted={isSubmitted}
        sourceName={sourceName}
        onSelect={setSelectedOptionIndex}
        onCheck={checkAnswer}
        onNext={goNext}
        onRestart={restart}
      />
    );
  }

  const removeFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const countPill = (active: boolean) =>
    `inline-flex h-10 min-w-[3.25rem] items-center justify-center rounded-full border px-4 text-[14px] font-semibold transition-colors ${QUIZ_FOCUS_RING} ${
      active
        ? "border-[var(--quiz-ink)] bg-[var(--quiz-ink)] text-[var(--quiz-bg)]"
        : "border-[var(--quiz-line)] bg-[var(--quiz-card)] text-[var(--quiz-strong)] hover:border-[var(--quiz-muted)]"
    }`;

  // Upload, generating and its failure share the run's column and card.
  return (
    <div className="quiz-run under-site-header min-h-dvh max-sm:-mt-[var(--safe-top)] max-sm:pb-[calc(96px+env(safe-area-inset-bottom))]">
      <main className={`${QUIZ_COLUMN} pb-10 pt-[calc(var(--safe-top)+12px)]`}>
        <QuizBackLink />

        {phase === "input" ? (
          <>
            <div className="mt-5 sm:mt-6">
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--quiz-strong)] sm:text-[32px]">
                Active Recall Quiz
              </h1>
              <p className="mt-2 text-[15.5px] leading-relaxed text-[var(--quiz-muted)]">
                ატვირთე PDF ან ტექსტი — მიიღებ ქვიზს, რომელიც გაგების შესამოწმებლადაა აწყობილი.
              </p>
            </div>

            <section
              aria-label="ქვიზის მასალა"
              className="mt-7 flex flex-col gap-6 rounded-[24px] border border-[var(--quiz-card-border)] bg-[var(--quiz-card)] p-5 sm:p-7"
            >
              {error ? (
                <p role="alert" className="rounded-[14px] border border-[var(--quiz-bad)] bg-[var(--quiz-bad-bg)] px-4 py-3 text-[14px] text-[var(--quiz-bad-text)]">
                  {error}
                </p>
              ) : null}

              <input
                ref={fileInputRef}
                id="quiz-file"
                type="file"
                accept=".pdf,application/pdf,.txt,.md,text/plain,text/markdown"
                className="sr-only"
                onChange={onFileInputChange}
              />
              <div
                data-quiz-drop
                onDrop={onDrop}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                className={`relative flex min-h-[140px] flex-col items-center justify-center rounded-[18px] border-[1.5px] border-dashed p-6 text-center transition-colors sm:min-h-[168px] ${
                  isDragActive
                    ? "border-[var(--quiz-accent)] bg-[var(--quiz-accent-soft)]"
                    : "border-[var(--quiz-drop-border)] bg-[var(--quiz-drop-bg)]"
                }`}
              >
                {file ? (
                  <div className="flex w-full max-w-md items-center gap-3 rounded-[14px] border border-[var(--quiz-line)] bg-[var(--quiz-card)] px-4 py-3 text-left">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--quiz-accent-soft)] text-[#be185d] dark:text-pink-300" aria-hidden>
                      <FileText className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-[var(--quiz-strong)]">{file.name}</span>
                      <span className="block text-[13px] text-[var(--quiz-muted)]">{formatFileSize(file.size)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={removeFile}
                      aria-label="ფაილის წაშლა"
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--quiz-muted)] transition-colors hover:bg-[var(--quiz-drop-bg)] hover:text-[var(--quiz-strong)] ${QUIZ_FOCUS_RING}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="quiz-file" className="flex cursor-pointer flex-col items-center after:absolute after:inset-0 after:rounded-[18px] after:content-['']">
                    <UploadIconBadge />
                    <span className="mt-3 text-[16px] font-semibold text-[var(--quiz-strong)]">ჩააგდე ფაილი ან დააწკაპუნე ასარჩევად</span>
                    <span className="mt-1 text-[13px] text-[var(--quiz-muted)]">PDF (მაქს. 15 MB) · TXT / MD (მაქს. 2 MB)</span>
                  </label>
                )}
              </div>

              <div>
                <p id="quiz-count-label" className="text-[14px] font-semibold text-[var(--quiz-strong)]">
                  კითხვების რაოდენობა
                </p>
                <div role="group" aria-labelledby="quiz-count-label" className="mt-3 flex flex-wrap gap-2">
                  {QUESTION_COUNT_OPTIONS.map((count) => {
                    const active = !isCustomCount && questionCount === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          setIsCustomCount(false);
                          setQuestionCount(count);
                        }}
                        aria-pressed={active}
                        className={countPill(active)}
                      >
                        {count}
                      </button>
                    );
                  })}
                  {isCustomCount ? (
                    <label className={`${countPill(true)} gap-1.5`}>
                      <span className="sr-only">კითხვების რაოდენობა ({MIN_QUESTIONS}–{MAX_QUESTIONS})</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        autoFocus
                        min={MIN_QUESTIONS}
                        max={MAX_QUESTIONS}
                        value={questionCount}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (Number.isNaN(value)) return;
                          setQuestionCount(Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, Math.round(value))));
                        }}
                        className="w-10 bg-transparent text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </label>
                  ) : (
                    <button type="button" onClick={() => setIsCustomCount(true)} aria-pressed={false} className={countPill(false)}>
                      სხვა
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop: the main button closes the card. */}
              <div className="hidden justify-end sm:flex">
                <button type="button" data-quiz-primary onClick={handleQuizGeneration} disabled={!file} className={QUIZ_PRIMARY_BUTTON}>
                  ქვიზის შექმნა
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden />
                </button>
              </div>
            </section>

            {/* Phone: pinned to the bottom, like „შემოწმება“ in the run. */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--quiz-line)] bg-[var(--quiz-bg)] px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 sm:hidden">
              <button type="button" data-quiz-primary onClick={handleQuizGeneration} disabled={!file} className={QUIZ_PRIMARY_BUTTON}>
                ქვიზის შექმნა
                <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden />
              </button>
            </div>
          </>
        ) : (
          <div className="mt-5 sm:mt-6">
            <QuizGenerating
              key={phase}
              fileName={sourceName || "მასალა"}
              count={questionCount}
              error={phase === "failed" ? generationError : null}
              onRetry={handleQuizGeneration}
              onOtherFile={() => {
                setGenerationError(null);
                removeFile();
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
