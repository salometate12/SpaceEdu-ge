"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, MoreHorizontal, RotateCcw, X } from "lucide-react";
import { parseInline } from "@/lib/markdown-blocks";
import { setDockHidden } from "@/lib/mobile-overlay";
import {
  currentTurn,
  questionsToRepeat,
  isLastTurn,
  looksLikeCode,
  progressSegments,
  quizTotals,
  willComeBack,
  type QuizRunState,
  type SegmentState,
} from "@/lib/quiz-run";
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

/** Where „← დეშბორდზე“ goes: this space's dashboard. */
function useBackHref(): string {
  const [href, setHref] = useState("/dashboard-student");
  useEffect(() => {
    void Promise.resolve().then(() => setHref(getSpaceBackTarget({ from: null, space: readSpaceeduSpace() }).href));
  }, []);
  return href;
}

function Progress({ segments, number }: { segments: SegmentState[]; number: number }) {
  return (
    <div
      role="img"
      data-quiz-progress
      aria-label={`პროგრესი: კითხვა ${number} / ${segments.length}`}
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
 * „რატომ?“ with one „შემდეგი →“. A wrong answer comes back once at the end
 * (`quiz-run.ts`). Keys 1–4 choose, Enter checks / goes on. On phones the
 * main button stays pinned to the bottom and the dock steps aside. State
 * lives in the quiz page.
 */
export function QuizRun({
  question,
  run,
  selected,
  submitted,
  sourceName,
  onSelect,
  onCheck,
  onNext,
  onRestart,
}: {
  question: QuizRunQuestion;
  run: QuizRunState;
  selected: number | null;
  submitted: boolean;
  sourceName: string;
  onSelect: (option: number) => void;
  onCheck: () => void;
  onNext: () => void;
  onRestart: () => void;
}) {
  const turn = currentTurn(run);
  const index = turn?.question ?? 0;
  const repeat = turn?.repeat ?? false;
  const total = run.status.length;
  const last = isLastTurn(run);
  const totals = quizTotals(run);
  const answered = run.chosen.filter((choice) => choice !== null).length;
  const segments = progressSegments(run, { checked: submitted });
  const backHref = useBackHref();

  // The phone's main button owns the bottom edge while the quiz runs.
  useEffect(() => {
    setDockHidden("quiz-run", true);
    return () => setDockHidden("quiz-run", false);
  }, []);

  // Keys: 1–4 choose an answer, Enter checks it or goes on. Off while typing
  // somewhere, and Enter on another button keeps doing that button's thing.
  const keys = useRef({ submitted, selected, options: question.options.length, onSelect, onCheck, onNext });
  useEffect(() => {
    keys.current = { submitted, selected, options: question.options.length, onSelect, onCheck, onNext };
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=''], [contenteditable='true'], [role='menu']")) return;
      const now = keys.current;
      const digit = Number(event.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= now.options) {
        if (now.submitted) return;
        event.preventDefault();
        now.onSelect(digit - 1);
        return;
      }
      if (event.key !== "Enter") return;
      const button = target?.closest("button, a");
      if (button && !button.hasAttribute("data-quiz-option")) return;
      if (!now.submitted && now.selected === null) return;
      event.preventDefault();
      if (now.submitted) now.onNext();
      else now.onCheck();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
  const comesBack = submitted && wasWrong && willComeBack(run);

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
            <Progress segments={segments} number={index + 1} />
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
              {totals.correct} სწორი · {totals.toRepeat} გასამეორებელი
            </p>
          ) : null}
        </div>
        <div className="mt-5 hidden sm:block">
          <Progress segments={segments} number={index + 1} />
        </div>

        <section
          aria-label={`კითხვა ${index + 1} / ${total}`}
          className="mt-2 rounded-[24px] border border-[var(--quiz-card-border)] bg-[var(--quiz-card)] p-5 sm:mt-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full bg-[var(--quiz-chip)] px-3 py-1 text-[12.5px] font-bold text-[#1c1a17]">
              კითხვა {index + 1} / {total}
            </span>
            {repeat ? (
              <span className="rounded-full border border-[var(--quiz-line)] px-2.5 py-0.5 text-[12px] font-bold text-[var(--quiz-accent)]">
                გამეორება
              </span>
            ) : null}
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

          {comesBack ? (
            <p className="mt-4 flex items-center gap-1.5 text-[14px] font-medium text-[var(--quiz-muted)] sm:hidden">
              <RotateCcw className="h-4 w-4 text-[var(--quiz-accent)]" aria-hidden />
              ეს კითხვა ბოლოს ისევ დაბრუნდება
            </p>
          ) : null}

          {/* Desktop: the note on the left, the main button closes the card. */}
          <div className="mt-6 hidden items-center justify-between gap-4 sm:flex">
            {comesBack ? (
              <p className="flex items-center gap-1.5 text-[14px] font-medium text-[var(--quiz-muted)]">
                <RotateCcw className="h-4 w-4 text-[var(--quiz-accent)]" aria-hidden />
                ეს კითხვა ბოლოს ისევ დაბრუნდება
              </p>
            ) : (
              <span />
            )}
            {primary}
          </div>
        </section>
        <p className="mt-4 hidden text-center text-[13px] text-[var(--quiz-muted)] [@media(hover:hover)]:sm:block">
          კლავიატურა: 1–{question.options.length} პასუხის ასარჩევად · Enter {submitted ? "გასაგრძელებლად" : "შესამოწმებლად"}
        </p>
      </div>

      {/* Phone: pinned to the bottom, clear of the home indicator. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--quiz-line)] bg-[var(--quiz-bg)] px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 sm:hidden">
        {primary}
      </div>
    </div>
  );
}

/** One answer row on the results: yours (red) or the right one (green). */
function AnswerRow({ text, kind }: { text: string; kind: "right" | "yours" }) {
  const right = kind === "right";
  return (
    <div
      className={`flex items-center gap-3 rounded-[14px] border px-3.5 py-2.5 ${
        right
          ? "border-[var(--quiz-ok)] bg-[var(--quiz-ok-bg)] text-[var(--quiz-ok-text)]"
          : "border-[var(--quiz-bad)] bg-[var(--quiz-bad-bg)] text-[var(--quiz-bad-text)]"
      }`}
    >
      <span
        aria-hidden
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${right ? "bg-[var(--quiz-ok)]" : "bg-[var(--quiz-bad)]"}`}
      >
        {right ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <X className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className={`min-w-0 flex-1 break-words ${looksLikeCode(text) ? "quiz-code text-[14px]" : "text-[15px]"}`}>{text}</span>
      <span className="shrink-0 text-[12px] font-bold">{right ? "სწორი პასუხი" : "შენი პასუხი"}</span>
    </div>
  );
}

/**
 * The end of a run, in the same calm style: „X / N სწორი“, the questions
 * still to repeat (with the right answer and „რატომ?“), and „გაიმეორე
 * შეცდომები“ · „ახალი ქვიზი“ · „დეშბორდზე“.
 */
export function QuizResults({
  questions,
  run,
  sourceName,
  onRepeatMistakes,
  onNewQuiz,
  repeatRun = false,
}: {
  questions: QuizRunQuestion[];
  run: QuizRunState;
  sourceName: string;
  /** A run over the mistakes only: first tries aren't meaningful there. */
  repeatRun?: boolean;
  onRepeatMistakes: () => void;
  onNewQuiz: () => void;
}) {
  const backHref = useBackHref();
  const totals = quizTotals(run);
  const mistakes = questionsToRepeat(run);
  const percent = totals.total > 0 ? Math.round((totals.correct / totals.total) * 100) : 0;
  const quietButton = `inline-flex h-[52px] items-center justify-center rounded-full border border-[var(--quiz-line)] bg-[var(--quiz-card)] px-6 text-[15px] font-semibold text-[var(--quiz-strong)] transition-colors hover:border-[var(--quiz-muted)] max-sm:w-full ${FOCUS_RING}`;

  return (
    <div className="quiz-run under-site-header min-h-dvh max-sm:-mt-[var(--safe-top)]">
      <div className="mx-auto w-full max-w-[760px] px-4 pb-16 pt-[calc(var(--safe-top)+12px)] sm:px-6 sm:pt-10">
        <Link
          href={backHref}
          className={`inline-flex items-center gap-1.5 rounded-full py-2 text-[14px] font-medium text-[var(--quiz-muted)] transition-colors hover:text-[var(--quiz-strong)] ${FOCUS_RING}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          დეშბორდზე დაბრუნება
        </Link>

        <section
          aria-label="შედეგები"
          className="mt-4 rounded-[24px] border border-[var(--quiz-card-border)] bg-[var(--quiz-card)] p-6 sm:mt-6 sm:p-8"
        >
          {sourceName ? <p className="truncate text-[13px] font-medium text-[var(--quiz-muted)]">{sourceName}</p> : null}
          <p className="mt-1 text-[44px] font-bold leading-none tracking-tight text-[var(--quiz-strong)] sm:text-[52px]">
            {totals.correct} <span className="text-[var(--quiz-muted)]">/ {totals.total}</span>
            <span className="ml-2 align-middle text-[18px] font-bold text-[var(--quiz-ok)] sm:text-[20px]">სწორი</span>
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--quiz-text)]">
            {totals.toRepeat === 0
              ? "ყველა კითხვა სწორადაა. ძლიერი შედეგია."
              : `${totals.toRepeat} კითხვა ჯერ გასამეორებელია — ქვემოთ ნახე სწორი პასუხები და ახსნები.`}
          </p>
          {repeatRun ? null : (
            <p className="mt-1 text-[13px] text-[var(--quiz-muted)]">
              პირველივე ცდით: {totals.firstTry} / {totals.total} · სიზუსტე {percent}%
            </p>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {mistakes.length > 0 ? (
              <button
                type="button"
                onClick={onRepeatMistakes}
                className={`inline-flex h-[52px] items-center justify-center gap-2 rounded-full border-2 border-[var(--quiz-ink)] bg-[var(--quiz-accent)] px-7 text-[15px] font-bold text-white shadow-[4px_4px_0_0_var(--quiz-ink)] transition-[transform,box-shadow] duration-150 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--quiz-ink)] motion-reduce:transition-none max-sm:w-full ${FOCUS_RING}`}
              >
                <RotateCcw className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden />
                გაიმეორე შეცდომები
              </button>
            ) : null}
            <button type="button" onClick={onNewQuiz} className={quietButton}>
              ახალი ქვიზი
            </button>
            <Link href={backHref} className={quietButton}>
              დეშბორდზე
            </Link>
          </div>
        </section>

        {mistakes.length > 0 ? (
          <section aria-labelledby="quiz-review" className="mt-8">
            <h2 id="quiz-review" className="px-1 text-[13px] font-semibold text-[var(--quiz-muted)]">
              გასამეორებელი · {mistakes.length}
            </h2>
            <ol className="mt-3 space-y-3">
              {mistakes.map((index) => {
                const item = questions[index];
                const chosen = run.chosen[index];
                return (
                  <li key={index} className="rounded-[24px] border border-[var(--quiz-card-border)] bg-[var(--quiz-card)] p-5 sm:p-6">
                    <p className="text-[12.5px] font-bold text-[var(--quiz-muted)]">კითხვა {index + 1}</p>
                    <h3 className="mt-1 text-[17px] font-bold leading-[1.45] text-[var(--quiz-strong)]">{item.questionText}</h3>
                    <div className="mt-4 space-y-2">
                      {chosen !== null && chosen !== item.correctAnswerIndex ? (
                        <AnswerRow text={item.options[chosen]} kind="yours" />
                      ) : null}
                      <AnswerRow text={item.options[item.correctAnswerIndex]} kind="right" />
                    </div>
                    {item.explanation.trim() ? (
                      <div className="quiz-why mt-4 rounded-[18px] border border-[var(--quiz-why-border)] bg-[var(--quiz-why-bg)] px-4 py-3.5">
                        <p className="text-[12px] font-bold text-[var(--quiz-why-label)]">რატომ?</p>
                        <p className="mt-1 text-[15px] leading-[1.7] text-[var(--quiz-text)]">{inline(item.explanation)}</p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}
      </div>
    </div>
  );
}
