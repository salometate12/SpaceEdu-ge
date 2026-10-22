"use client";

import Link from "next/link";
import { FileText, Upload } from "lucide-react";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { SpaceBackLink } from "@/components/layout/SpaceBackLink";
import { StickerButton } from "@/components/ui/StickerButton";
import { QuizRun } from "@/components/Quiz/QuizRun";
import { QuizThinkingLoader } from "@/components/Quiz/QuizThinkingLoader";
import { recordDailyActivity } from "@/lib/daily-streak";
import { recordQuizResult } from "@/lib/dashboard-metrics";
import { getActiveSubject } from "@/lib/activity";
import { takeHandoff } from "@/lib/tool-handoff";
import type { QuestionResult } from "@/lib/quiz-run";
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

type Phase = "input" | "loading" | "active" | "results";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20];

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null,
  );
  const [score, setScore] = useState(0);
  // Per question, once checked: for the progress bar and the totals.
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phase: Phase = useMemo(() => {
    if (isLoading) return "loading";
    if (questions.length === 0) return "input";
    if (currentQuestionIndex >= questions.length) return "results";
    return "active";
  }, [isLoading, questions.length, currentQuestionIndex]);

  const currentQuestion = questions[currentQuestionIndex];

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

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
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
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setScore(0);
    setResults([]);
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
        const message =
          "message" in data && data.message
            ? String(data.message)
            : "error" in data && data.error
              ? String(data.error)
              : "AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.";
        throw new Error(message);
      }

      const generated = (data as QuizApiResponse).questions;
      setQuestions(generated);
      setResults(generated.map(() => null));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const checkAnswer = () => {
    if (selectedOptionIndex === null || !currentQuestion || isSubmitted) return;

    const isCorrect = selectedOptionIndex === currentQuestion.correctAnswerIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    setResults((prev) => prev.map((result, index) => (index === currentQuestionIndex ? (isCorrect ? "correct" : "wrong") : result)));
    setIsSubmitted(true);
  };

  const goNext = () => {
    if (currentQuestionIndex + 1 >= questions.length) {
      recordDailyActivity();
      recordQuizResult(score, questions.length, getActiveSubject());
    }
    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedOptionIndex(null);
    setIsSubmitted(false);
  };

  const restart = () => {
    setFile(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setScore(0);
    setResults([]);
    setIsSubmitted(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const percentScore =
    questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  if (phase === "active" && currentQuestion) {
    return (
      <QuizRun
        question={currentQuestion}
        index={currentQuestionIndex}
        results={results}
        selected={selectedOptionIndex}
        submitted={isSubmitted}
        sourceName={file ? file.name.replace(/\.[^.]+$/, "") : ""}
        onSelect={setSelectedOptionIndex}
        onCheck={checkAnswer}
        onNext={goNext}
        onRestart={restart}
      />
    );
  }

  return (
    // The results keep the quiz's calm colours (quiz-theme.css).
    <div className={phase === "results" ? "quiz-run under-site-header min-h-dvh" : undefined}>
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Suspense fallback={null}>
            <SpaceBackLink />
          </Suspense>
          <h1 className="headline mt-2 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
            Active Recall Quiz
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">
            ატვირთე PDF ან ტექსტი და მიიღე ღრმა გაგებაზე ორიენტირებული ქვიზი
          </p>
        </div>
        {questions.length > 0 && phase !== "loading" && (
          <button
            type="button"
            onClick={restart}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-pink-300 hover:text-pink-700 dark:border-white/[0.08] dark:text-zinc-400 dark:hover:border-white/[0.15] dark:hover:text-white"
          >
            თავიდან
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-300/50 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
        >
          {error}
        </div>
      )}

      {phase === "input" && (
        <section className="mx-auto flex w-full max-w-xl flex-col gap-4">
          <label
            onDrop={onDrop}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeave={() => setIsDragActive(false)}
            className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
              isDragActive
                ? "border-pink-400/60 bg-pink-50 dark:border-pink-500/40 dark:bg-none dark:bg-pink-500/[0.06]"
                : "border-slate-200 bg-gradient-to-br from-white to-pink-50/40 hover:border-pink-400/60 dark:border-white/[0.08] dark:bg-none dark:bg-[#121214]/20 dark:hover:border-pink-500/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf,.txt,.md,text/plain,text/markdown"
              className="hidden"
              onChange={onFileInputChange}
            />

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 transition group-hover:border-pink-300 group-hover:from-pink-50 group-hover:to-indigo-50 dark:border-white/[0.08] dark:bg-none dark:bg-white/[0.03] dark:group-hover:border-pink-500/30 dark:group-hover:bg-pink-500/10">
              <Upload className="h-6 w-6 text-pink-600 dark:text-pink-300" strokeWidth={1.5} />
            </div>

            <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">
              ჩააგდე ფაილი ან დააწკაპუნე ასარჩევად
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">
              მხარდაჭერილი ფორმატი: PDF (მაქს. 15 MB) · TXT / MD (მაქს. 2 MB)
            </p>

            {file && (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-pink-300/50 bg-pink-50 px-3 py-2 text-xs text-pink-700 dark:border-pink-500/25 dark:bg-none dark:bg-pink-500/10 dark:text-pink-200">
                <FileText className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span className="truncate">
                  {file.name} ({formatFileSize(file.size)})
                </span>
              </div>
            )}
          </label>

          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-zinc-400">კითხვების რაოდენობა</p>
            <div className="flex flex-wrap gap-2">
              {QUESTION_COUNT_OPTIONS.map((count) => {
                const isActive = !isCustomCount && questionCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setIsCustomCount(false);
                      setQuestionCount(count);
                    }}
                    aria-pressed={isActive}
                    className={`min-w-[3.25rem] rounded-xl border px-3 py-2 text-sm font-medium transition-all active:scale-[0.97] ${
                      isActive
                        ? "border-pink-400/60 bg-pink-50 text-pink-700 dark:border-pink-400/50 dark:bg-pink-500/15 dark:text-pink-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-pink-300 hover:text-pink-700 dark:border-white/[0.08] dark:bg-[#161619] dark:text-zinc-300 dark:hover:border-pink-500/20 dark:hover:text-white"
                    }`}
                  >
                    {count}
                  </button>
                );
              })}

              <label
                className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                  isCustomCount
                    ? "border-pink-400/60 bg-pink-50 text-pink-700 dark:border-pink-400/50 dark:bg-pink-500/15 dark:text-pink-200"
                    : "border-dashed border-slate-300 bg-white text-slate-500 hover:border-pink-300 hover:text-pink-700 dark:border-white/15 dark:bg-[#161619] dark:text-zinc-400 dark:hover:border-pink-500/20 dark:hover:text-white"
                }`}
              >
                <input
                  type="number"
                  inputMode="numeric"
                  min={3}
                  max={25}
                  placeholder="სხვა"
                  value={isCustomCount ? questionCount : ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    if (!raw) {
                      setIsCustomCount(false);
                      return;
                    }
                    const value = Number(raw);
                    if (Number.isNaN(value)) return;
                    setIsCustomCount(true);
                    setQuestionCount(Math.min(25, Math.max(3, Math.round(value))));
                  }}
                  className="w-12 bg-transparent text-center outline-none [appearance:textfield] placeholder:text-slate-400 dark:placeholder:text-zinc-600 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </label>
            </div>
          </div>

          <StickerButton
            onClick={handleQuizGeneration}
            disabled={isLoading || !file}
            loading={isLoading}
            fullWidth
          >
            ქვიზის გენერირება
          </StickerButton>
        </section>
      )}

      {phase === "loading" && (
        <div className="dashboard-section p-6 backdrop-blur-xl sm:p-8">
          <QuizThinkingLoader
            questionCount={questionCount}
            hint={
              file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))
                ? "PDF-ის დამუშავება მიმდინარეობს..."
                : "მასალის დამუშავება მიმდინარეობს..."
            }
          />
        </div>
      )}

      {phase === "results" && (
        <section className="rounded-[24px] border border-[var(--quiz-card-border)] bg-[var(--quiz-card)] p-8">
          <h2 className="headline text-xl font-bold text-[var(--quiz-strong)]">შედეგები</h2>
          <p className="mono mt-3 text-3xl font-bold text-[var(--quiz-accent)]">
            {score} / {questions.length}
          </p>
          <p className="mt-1 text-sm text-[var(--quiz-muted)]">სიზუსტე: {percentScore}%</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--quiz-text)]">
            {percentScore >= 80
              ? "ძლიერი შედეგი. გაიმეორე მხოლოდ სუსტ თემებზე."
              : percentScore >= 50
                ? "საშუალო შედეგი. რეკომენდებულია მასალის მეორედ გადახედვა."
                : "საჭიროა დამატებითი განმეორება ამ თემაზე."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={restart}
              className="rounded-full border border-[var(--quiz-line)] bg-[var(--quiz-card)] px-4 py-2.5 text-sm font-medium text-[var(--quiz-strong)] transition hover:border-[var(--quiz-muted)]"
            >
              ახალი ქვიზი
            </button>
            <Link
              href="/"
              className="rounded-full border-2 border-[var(--quiz-ink)] bg-[var(--quiz-accent)] px-4 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_0_var(--quiz-ink)] transition-[transform,box-shadow] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              მთავარზე დაბრუნება
            </Link>
          </div>
        </section>
      )}
    </main>
    </div>
  );
}
