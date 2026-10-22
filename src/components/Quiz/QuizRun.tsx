"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, MoreHorizontal, RotateCcw, X } from "lucide-react";
import { parseInline } from "@/lib/markdown-blocks";
import { setDockHidden } from "@/lib/mobile-overlay";
import { looksLikeCode, progressSegments, type QuestionResult, type SegmentState } from "@/lib/quiz-run";
import { getSpaceBackTarget, readSpaceeduSpace } from "@/lib/space-back-navigation";

export interface QuizRunQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

const LETTERS = ["A", "B", "C", "D"];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--quiz-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--quiz-bg)]";

/** The page's quiet round buttons (back, ⋯). */
const ROUND_BUTTON = `inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--quiz-line)] bg-[var(--quiz-card)] text-[var(--quiz-strong)] transition-colors hover:border-[var(--quiz-muted)] ${FOCUS_RING}`;

const SEGMENT_CLASS: Record<SegmentState, string> = {
  correct: "border-transparent bg-[var(--quiz-seg-ok)]",
  wrong: "border-transparent bg-[var(--quiz-seg-bad)]",
  current: "border-transparent bg-[var(--quiz-seg-current)]",
  pending: "border-[var(--quiz-seg-border)] bg-[var(--quiz-seg-todo)]",
};

/** **bold** as a marker stroke, `code` as code. */
function inline(text: string): ReactNode[] {
  return parseInline(text).map((segment, index) =>
    segment.type === "bold" ? (
      <strong key={index}>{segment.text}</strong>
    ) : segment.type === "code" ? (
      <code key={index}>{segment.text}</code>
    ) : (
      segment.text
    ),
  );
}

function Progress({ results, index }: { results: QuestionResult[]; index: number }) {
  const segments = progressSegments(results, index);
  return (
    <div
      role="img"
      data-quiz-progress
      aria-label={`პროგრესი: კითხვა ${index + 1} / ${results.length}`}
      className="grid gap-1 sm:gap-1.5"
      style={{ gridTemplateColumns: `repeat(${segments.length}, minmax(0, 1fr))` }}
    >
      {segments.map((state, segment) => (
        <span
          key={segment}
          data-state={state}
          className={`h-1.5 rounded-full border transition-colors duration-300 ${SEGMENT_CLASS[state]}`}
        />
      ))}
    </div>
  );
}

/** ⋯ with „თავიდან“ inside; asks first once something is answered. */
function RunMenu({ onRestart, confirmFirst }: { onRestart: () => void; confirmFirst: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const item = `flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium transition-colors hover:bg-[var(--quiz-bg)] ${FOCUS_RING}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          setConfirming(false);
        }}
        aria-label="მეტი"
        aria-haspopup="menu"
        aria-expanded={open}
        className={ROUND_BUTTON}
      >
        <MoreHorizontal className="h-[18px] w-[18px]" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-60 rounded-2xl border border-[var(--quiz-line)] bg-[var(--quiz-card)] p-1.5 text-[var(--quiz-strong)] shadow-[0_12px_32px_-12px_rgb(15_23_42/0.3)]"
        >
          {confirming ? (
            <>
              <p className="px-3 pb-1 pt-2 text-[13px] font-medium text-[var(--quiz-muted)]">დავიწყოთ თავიდან? პასუხები წაიშლება.</p>
              <button type="button" role="menuitem" onClick={onRestart} className={`${item} text-[var(--quiz-bad)]`}>
                <RotateCcw className="h-4 w-4" aria-hidden />
                კი, თავიდან
              </button>
              <button type="button" role="menuitem" onClick={() => setConfirming(false)} className={item}>
                გაუქმება
              </button>
            </>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => (confirmFirst ? setConfirming(true) : onRestart())}
              className={item}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              თავიდან
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Taking the quiz: one question at a time on a calm cream page — a thin
 * segmented progress bar, the answers, „შემოწმება“, then red/green and
 * „რატომ?“ with one „შემდეგი →“. On phones the main button stays pinned to
 * the bottom and the dock steps aside. State lives in the quiz page.
 */
export function QuizRun({
  question,
  index,
  results,
  selected,
  submitted,
  sourceName,
  onSelect,
  onCheck,
  onNext,
  onRestart,
}: {
  question: QuizRunQuestion;
  index: number;
  results: QuestionResult[];
  selected: number | null;
  submitted: boolean;
  sourceName: string;
  onSelect: (option: number) => void;
  onCheck: () => void;
  onNext: () => void;
  onRestart: () => void;
}) {
  const total = results.length;
  const last = index + 1 >= total;
  const correct = results.filter((result) => result === "correct").length;
  const answered = results.filter((result) => result !== null).length;
  const [backHref, setBackHref] = useState("/dashboard-student");

  useEffect(() => {
    void Promise.resolve().then(() => setBackHref(getSpaceBackTarget({ from: null, space: readSpaceeduSpace() }).href));
  }, []);

  // The phone's main button owns the bottom edge while the quiz runs.
  useEffect(() => {
    setDockHidden("quiz-run", true);
    return () => setDockHidden("quiz-run", false);
  }, []);

  const optionState = (option: number): "idle" | "selected" | "right" | "wrong" | "muted" => {
    if (!submitted) return option === selected ? "selected" : "idle";
    if (option === question.correctAnswerIndex) return "right";
    if (option === selected) return "wrong";
    return "muted";
  };

  const primary = submitted ? (
    <button
      type="button"
      data-quiz-primary
      onClick={onNext}
      className={`inline-flex h-[52px] items-center justify-center gap-2 rounded-full border-2 border-[var(--quiz-ink)] bg-[var(--quiz-ink)] px-7 text-[15px] font-bold text-[var(--quiz-bg)] shadow-[4px_4px_0_0_var(--quiz-accent)] transition-[transform,box-shadow] duration-150 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--quiz-accent)] motion-reduce:transition-none max-sm:w-full ${FOCUS_RING}`}
    >
      {last ? "შედეგების ნახვა" : "შემდეგი"}
      <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden />
    </button>
  ) : (
    <button
      type="button"
      data-quiz-primary
      onClick={onCheck}
      disabled={selected === null}
      className={`inline-flex h-[52px] items-center justify-center rounded-full border-2 border-[var(--quiz-ink)] bg-[var(--quiz-accent)] px-8 text-[15px] font-bold text-white shadow-[4px_4px_0_0_var(--quiz-ink)] transition-[transform,box-shadow,opacity] duration-150 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--quiz-ink)] disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none max-sm:w-full ${FOCUS_RING}`}
    >
      შემოწმება
    </button>
  );

  const wasWrong = submitted && selected !== question.correctAnswerIndex;

  return (
    <div className="quiz-run under-site-header min-h-dvh max-sm:-mt-[var(--safe-top)] max-sm:pb-[calc(96px+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-[760px] px-4 pb-10 sm:px-6 sm:pt-10">
        {/* Top: back to the dashboard, and ⋯ with „თავიდან“. On phones the progress sits between them. */}
        <header className="sticky top-0 z-30 -mx-4 flex items-center gap-3 bg-[var(--quiz-bg)] px-4 pb-3 pt-[calc(var(--safe-top)+12px)] sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pt-0">
          <Link href={backHref} aria-label="დეშბორდზე დაბრუნება" className={`${ROUND_BUTTON} sm:hidden`}>
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <Link
            href={backHref}
            className={`hidden items-center gap-1.5 rounded-full text-[14px] font-medium text-[var(--quiz-muted)] transition-colors hover:text-[var(--quiz-strong)] sm:inline-flex ${FOCUS_RING}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            დეშბორდზე დაბრუნება
          </Link>
          <div className="min-w-0 flex-1 sm:hidden">
            <Progress results={results} index={index} />
          </div>
          <div className="hidden flex-1 sm:block" />
          <RunMenu onRestart={onRestart} confirmFirst={answered > 0} />
        </header>

        {/* Desktop: where the questions come from, and how it's going. */}
        <div className="mt-6 hidden items-end justify-between gap-4 sm:flex">
          <div className="min-w-0">
            {sourceName ? <p className="truncate text-[13px] font-medium text-[var(--quiz-muted)]">{sourceName}</p> : null}
            <h1 className="mt-1 text-[34px] font-bold leading-tight tracking-tight text-[var(--quiz-strong)]">Active Recall Quiz</h1>
          </div>
          {answered > 0 ? (
            <p className="flex shrink-0 items-center gap-1.5 pb-1.5 text-[14px] font-bold text-[var(--quiz-ok)]">
              <Check className="h-4 w-4" strokeWidth={2.6} aria-hidden />
              {correct} სწორი · {answered - correct} გასამეორებელი
            </p>
          ) : null}
        </div>
        <div className="mt-5 hidden sm:block">
          <Progress results={results} index={index} />
        </div>

        <section
          aria-label={`კითხვა ${index + 1} / ${total}`}
          className="mt-2 rounded-[24px] border border-[var(--quiz-card-border)] bg-[var(--quiz-card)] p-5 sm:mt-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full bg-[var(--quiz-chip)] px-3 py-1 text-[12.5px] font-bold text-[#1c1a17]">
              კითხვა {index + 1} / {total}
            </span>
            <span className="text-[13px] font-medium text-[var(--quiz-muted)]">ერთი სწორი პასუხი</span>
          </div>
          <h2 className="mt-4 text-[21px] font-bold leading-[1.4] text-[var(--quiz-strong)] sm:text-[23px]">{question.questionText}</h2>

          <div className="mt-6 space-y-3">
            {question.options.map((option, optionIndex) => {
              const state = optionState(optionIndex);
              const code = looksLikeCode(option);
              const box: Record<typeof state, string> = {
                idle: "border-[var(--quiz-line)] bg-[var(--quiz-card)] hover:border-[var(--quiz-muted)]",
                selected:
                  "border-[var(--quiz-ink)] bg-[var(--quiz-accent-soft)] shadow-[4px_4px_0_0_var(--quiz-ink)] -translate-x-px -translate-y-px",
                right: "border-[var(--quiz-ok)] bg-[var(--quiz-ok-bg)] text-[var(--quiz-ok-text)]",
                wrong: "border-[var(--quiz-bad)] bg-[var(--quiz-bad-bg)] text-[var(--quiz-bad-text)]",
                muted: "border-[var(--quiz-line)] bg-[var(--quiz-card)] opacity-60",
              };
              const circle: Record<typeof state, string> = {
                idle: "border-[var(--quiz-line)] bg-[var(--quiz-card)] text-[var(--quiz-strong)]",
                selected: "border-[var(--quiz-ink)] bg-[var(--quiz-accent)] text-white",
                right: "border-[var(--quiz-ok)] bg-[var(--quiz-ok)] text-white",
                wrong: "border-[var(--quiz-bad)] bg-[var(--quiz-bad)] text-white",
                muted: "border-[var(--quiz-line)] bg-[var(--quiz-card)] text-[var(--quiz-muted)]",
              };
              const tag =
                state === "right" ? (wasWrong ? "სწორი პასუხი" : "შენი პასუხი") : state === "wrong" ? "შენი პასუხი" : null;
              return (
                <button
                  key={optionIndex}
                  type="button"
                  data-quiz-option
                  data-state={state}
                  disabled={submitted}
                  aria-pressed={!submitted ? state === "selected" : undefined}
                  aria-label={`${LETTERS[optionIndex]}: ${option}${tag ? ` — ${tag}` : ""}`}
                  onClick={() => onSelect(optionIndex)}
                  className={`flex min-h-[56px] w-full items-center gap-3 rounded-[18px] border-2 px-3.5 py-2.5 text-left text-[var(--quiz-text)] transition-[border-color,background-color,box-shadow,transform] duration-150 disabled:cursor-default motion-reduce:transition-none sm:min-h-[60px] sm:px-4 ${box[state]} ${FOCUS_RING}`}
                >
                  <span
                    aria-hidden
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[13px] font-bold ${circle[state]}`}
                  >
                    {state === "right" ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : state === "wrong" ? (
                      <X className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      LETTERS[optionIndex]
                    )}
                  </span>
                  <span
                    data-option-text
                    className={`min-w-0 flex-1 break-words ${code ? "quiz-code text-[14.5px] leading-snug" : "text-[16px] leading-snug"}`}
                  >
                    {option}
                  </span>
                  {tag ? <span className="shrink-0 text-[12.5px] font-bold">{tag}</span> : null}
                </button>
              );
            })}
          </div>

          {submitted && question.explanation.trim() ? (
            <div
              data-quiz-why
              className="quiz-why mt-5 rounded-[18px] border border-[var(--quiz-why-border)] bg-[var(--quiz-why-bg)] px-4 py-3.5"
            >
              <p className="text-[12px] font-bold text-[var(--quiz-why-label)]">რატომ?</p>
              <p className="mt-1 text-[15.5px] leading-[1.7] text-[var(--quiz-text)]">{inline(question.explanation)}</p>
            </div>
          ) : null}

          {/* Desktop: the main button closes the card. */}
          <div className="mt-6 hidden justify-end sm:flex">{primary}</div>
        </section>
      </div>

      {/* Phone: pinned to the bottom, clear of the home indicator. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--quiz-line)] bg-[var(--quiz-bg)] px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 sm:hidden">
        {primary}
      </div>
    </div>
  );
}
