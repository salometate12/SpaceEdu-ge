"use client";

import Link from "next/link";
import { FileText, Upload } from "lucide-react";
import {
  Suspense,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { SpaceBackLink } from "@/components/layout/SpaceBackLink";
import { AiSkeletonLoader } from "@/components/ui/AiSkeletonLoader";
import { recordDailyActivity } from "@/lib/daily-streak";

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
  const [isDragActive, setIsDragActive] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [isCustomCount, setIsCustomCount] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null,
  );
  const [score, setScore] = useState(0);
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
  const progressPercent =
    questions.length > 0
      ? ((currentQuestionIndex + 1) / questions.length) * 100
      : 0;

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

      setQuestions((data as QuizApiResponse).questions);
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
    setIsSubmitted(true);
  };

  const goNext = () => {
    if (currentQuestionIndex + 1 >= questions.length) {
      recordDailyActivity();
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
    setIsSubmitted(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const percentScore =
    questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  return (
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
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/[0.08] dark:text-zinc-400 dark:hover:border-white/[0.15] dark:hover:text-white"
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
                ? "border-violet-400/60 bg-violet-50 dark:border-purple-500/40 dark:bg-none dark:bg-purple-500/[0.06]"
                : "border-slate-200 bg-gradient-to-br from-white to-violet-50/40 hover:border-violet-400/60 dark:border-white/[0.08] dark:bg-none dark:bg-[#121214]/20 dark:hover:border-purple-500/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf,.txt,.md,text/plain,text/markdown"
              className="hidden"
              onChange={onFileInputChange}
            />

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 transition group-hover:border-violet-300 group-hover:from-violet-50 group-hover:to-indigo-50 dark:border-white/[0.08] dark:bg-none dark:bg-white/[0.03] dark:group-hover:border-purple-500/30 dark:group-hover:bg-purple-500/10">
              <Upload className="h-6 w-6 text-violet-600 dark:text-purple-300" strokeWidth={1.5} />
            </div>

            <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">
              ჩააგდე ფაილი ან დააწკაპუნე ასარჩევად
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">
              მხარდაჭერილი ფორმატი: PDF (მაქს. 15 MB) · TXT / MD (მაქს. 2 MB)
            </p>

            {file && (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-violet-300/50 bg-violet-50 px-3 py-2 text-xs text-violet-700 dark:border-purple-500/25 dark:bg-none dark:bg-purple-500/10 dark:text-purple-200">
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
                        ? "border-violet-400/60 bg-violet-50 text-violet-700 dark:border-purple-400/50 dark:bg-purple-500/15 dark:text-purple-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:text-violet-700 dark:border-white/[0.08] dark:bg-[#161619] dark:text-zinc-300 dark:hover:border-purple-500/20 dark:hover:text-white"
                    }`}
                  >
                    {count}
                  </button>
                );
              })}

              <label
                className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                  isCustomCount
                    ? "border-violet-400/60 bg-violet-50 text-violet-700 dark:border-purple-400/50 dark:bg-purple-500/15 dark:text-purple-200"
                    : "border-dashed border-slate-300 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-700 dark:border-white/15 dark:bg-[#161619] dark:text-zinc-400 dark:hover:border-purple-500/20 dark:hover:text-white"
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

          <button
            type="button"
            onClick={handleQuizGeneration}
            disabled={isLoading || !file}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/10 transition hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ქვიზის გენერირება
          </button>
        </section>
      )}

      {phase === "loading" && (
        <div className="space-y-4">
          <p className="text-center text-sm text-slate-600 dark:text-zinc-400">
            {file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))
              ? "PDF-ის დამუშავება მიმდინარეობს..."
              : "მასალის დამუშავება მიმდინარეობს..."}
          </p>
          <AiSkeletonLoader rows={4} />
        </div>
      )}

      {phase === "active" && currentQuestion && (
        <section className="dashboard-section p-6 backdrop-blur-xl sm:p-8">
          <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-purple-300/80">
            კითხვა {currentQuestionIndex + 1} / {questions.length}
          </p>
          <h2 className="mb-6 text-lg font-semibold leading-relaxed text-slate-900 dark:text-white">
            {currentQuestion.questionText}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, optionIndex) => {
              const isSelected = selectedOptionIndex === optionIndex;
              const isCorrectOption =
                optionIndex === currentQuestion.correctAnswerIndex;
              let stateClass =
                "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-gray-300 dark:hover:bg-white/[0.04] dark:hover:border-purple-500/30";

              if (isSubmitted) {
                if (isCorrectOption) {
                  stateClass =
                    "border-emerald-400/50 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/[0.02] dark:text-emerald-400";
                } else if (isSelected && !isCorrectOption) {
                  stateClass =
                    "border-rose-400/50 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/[0.02] dark:text-rose-300";
                } else {
                  stateClass =
                    "border-slate-200 bg-slate-50 text-slate-400 opacity-70 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-500";
                }
              } else if (isSelected) {
                stateClass =
                  "border-violet-400/50 bg-violet-50 text-violet-800 dark:border-purple-500/40 dark:bg-purple-500/[0.06] dark:text-purple-100";
              }

              return (
                <button
                  key={`${currentQuestion.id}-${optionIndex}`}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => setSelectedOptionIndex(optionIndex)}
                  className={`w-full rounded-xl border p-4 text-left text-sm transition-all duration-200 ${stateClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {!isSubmitted ? (
            <button
              type="button"
              onClick={checkAnswer}
              disabled={selectedOptionIndex === null}
              className="mt-6 w-full rounded-xl border border-violet-300/60 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-200 dark:hover:bg-purple-500/20"
            >
              შემოწმება
            </button>
          ) : (
            <>
              <div className="animate-fade-in mt-4 rounded-xl border border-violet-200/80 bg-violet-50/50 p-4 text-xs leading-relaxed text-slate-600 dark:border-purple-500/[0.1] dark:bg-purple-500/[0.03] dark:text-gray-400">
                {currentQuestion.explanation}
              </div>
              <button
                type="button"
                onClick={goNext}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-purple-500 hover:to-indigo-500"
              >
                {currentQuestionIndex + 1 >= questions.length
                  ? "შედეგების ნახვა"
                  : "შემდეგი კითხვა"}
              </button>
            </>
          )}
        </section>
      )}

      {phase === "results" && (
        <section className="dashboard-section p-8 backdrop-blur-xl">
          <h2 className="headline text-xl font-bold text-slate-900 dark:text-white">შედეგები</h2>
          <p className="mono mt-3 text-3xl font-bold text-violet-600 dark:text-purple-300">
            {score} / {questions.length}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">სიზუსტე: {percentScore}%</p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
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
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/[0.08] dark:text-zinc-300 dark:hover:border-purple-500/30 dark:hover:text-white"
            >
              ახალი ქვიზი
            </button>
            <Link
              href="/"
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-purple-500 hover:to-indigo-500"
            >
              მთავარზე დაბრუნება
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
