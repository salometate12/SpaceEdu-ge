"use client";

import { useEffect, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { QUIZ_FOCUS_RING, QUIZ_PRIMARY_BUTTON } from "./QuizRun";

const STEPS = ["ვკითხულობ ატვირთულ მასალას", "ვარჩევ მთავარ ცნებებს…", "ვწერ კითხვებს და ახსნებს"];
/** The API doesn't report stages: the steps move on with time, the last one waits for the answer. */
const STEP_AT_MS = [3000, 8000];
const BAR_WIDTH = ["22%", "55%", "86%"];

/**
 * The quiz being written, in the quiz's calm style: the file and count
 * above a thin bar where the run's progress will be, three steps, and
 * skeleton rows for the questions to come. On failure the same card shows
 * the error with „ხელახლა ცდა“ and „სხვა ფაილი“.
 */
export function QuizGenerating({
  fileName,
  count,
  error,
  onRetry,
  onOtherFile,
}: {
  fileName: string;
  count: number;
  /** Set when generation failed. */
  error?: string | null;
  onRetry?: () => void;
  onOtherFile?: () => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (error) return;
    const timers = STEP_AT_MS.map((ms, index) => window.setTimeout(() => setStep(index + 1), ms));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [error]);

  return (
    <>
      {/* Desktop: the run's title block, so the card doesn't jump when the questions arrive. */}
      <div className="hidden items-end justify-between gap-4 sm:flex">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-[var(--quiz-muted)]">{fileName}</p>
          <p className="mt-1 text-[34px] font-bold leading-tight tracking-tight text-[var(--quiz-strong)]">Active Recall Quiz</p>
        </div>
        <p className="shrink-0 pb-1.5 text-[14px] font-medium text-[var(--quiz-muted)]">
          {count} კითხვა · {error ? "ვერ შევქმენი" : "ვამზადებ…"}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 text-[13px] font-medium text-[var(--quiz-muted)] sm:hidden">
        <p className="min-w-0 truncate">
          {fileName} · {count} კითხვა
        </p>
        <p className="shrink-0">{error ? "ვერ შევქმენი" : "ვამზადებ…"}</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden sm:mt-5 rounded-full bg-[var(--quiz-card-border)]" aria-hidden>
        <div
          className="h-full rounded-full bg-[var(--quiz-ink)] transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: error ? "0%" : BAR_WIDTH[step] }}
        />
      </div>

      <section
        aria-label={error ? "ქვიზი ვერ შეიქმნა" : "ქვიზი მზადდება"}
        className="mt-6 rounded-[24px] border border-[var(--quiz-card-border)] bg-[var(--quiz-card)] p-6 sm:mt-9 sm:p-9"
      >
        {error ? (
          <div role="alert">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--quiz-bad)] text-white" aria-hidden>
              <X className="h-5 w-5" strokeWidth={3} />
            </span>
            <h2 className="mt-4 text-[22px] font-bold text-[var(--quiz-strong)]">ქვიზი ვერ შევქმენი</h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--quiz-text)]">{error}</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onOtherFile}
                className={`rounded-full px-2 py-2 text-[14.5px] font-semibold text-[var(--quiz-muted)] transition-colors hover:text-[var(--quiz-strong)] ${QUIZ_FOCUS_RING}`}
              >
                სხვა ფაილი
              </button>
              <button type="button" onClick={onRetry} className={QUIZ_PRIMARY_BUTTON}>
                <RotateCcw className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden />
                ხელახლა ცდა
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-[22px] font-bold text-[var(--quiz-strong)] sm:text-[24px]">ვამზადებ შენს ქვიზს</h2>
            <ol className="mt-5 space-y-3.5" aria-live="polite">
              {STEPS.map((label, index) => {
                const state = index < step ? "done" : index === step ? "current" : "next";
                return (
                  <li
                    key={label}
                    aria-current={state === "current" ? "step" : undefined}
                    className={`flex items-center gap-3 ${state === "next" ? "opacity-50" : ""}`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        state === "done"
                          ? "bg-[var(--quiz-ok)] text-white"
                          : state === "current"
                            ? "border-2 border-[var(--quiz-ink)] bg-[var(--quiz-accent-soft)]"
                            : "border-2 border-[var(--quiz-line)]"
                      }`}
                    >
                      {state === "done" ? (
                        <Check className="h-4 w-4" strokeWidth={3} />
                      ) : state === "current" ? (
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--quiz-accent)] motion-reduce:animate-none" />
                      ) : null}
                    </span>
                    <span
                      className={`text-[15.5px] ${
                        state === "current" ? "font-semibold text-[var(--quiz-strong)]" : "text-[var(--quiz-text)]"
                      }`}
                    >
                      {label}
                      {state === "done" ? <span className="sr-only"> — მზადაა</span> : null}
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="mt-7 border-t border-[var(--quiz-card-border)] pt-5">
              <p className="text-[13px] font-medium text-[var(--quiz-muted)]">კითხვები მალე გამოჩნდება</p>
              <div className="mt-3 space-y-2.5" aria-hidden>
                {[1, 0.7, 0.45].map((opacity) => (
                  <div key={opacity} className="quiz-skeleton h-[52px] rounded-[16px]" style={{ opacity }} />
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
