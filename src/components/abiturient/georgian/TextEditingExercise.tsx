"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ClipboardList,
  Copy,
  Sparkles,
  Timer,
} from "lucide-react";
import {
  INITIAL_ATTEMPTS,
  buildAttemptPreview,
  evaluateTextEditing,
  type TextEditingAttempt,
  type TextEditingEvaluation,
} from "@/lib/georgian-text-editing";
import {
  paperLabel,
  pastEditingTasks,
  pickRandomEditingTask,
  type PastEditingTask,
} from "@/lib/georgian-past-paper-practice";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_SOLID,
  ACCENT_TEXT,
  PLAIN_CARD,
} from "@/components/landing/notebook/accents";
import { Pencil, Sparkle, Sun } from "@/components/landing/notebook/Doodles";

const GEORGIAN_HUB_HREF = "/subject/georgian/space";

/** How deep the Part I pool is, said on the page so the offer is concrete. */
const ALL_TASKS = pastEditingTasks();
const TASK_COUNT = ALL_TASKS.length;
const YEAR_RANGE = (() => {
  const years = ALL_TASKS.map((task) => task.year);
  return years.length > 0
    ? `${Math.min(...years)}–${Math.max(...years)}`
    : "";
})();
/** How long the sheet takes to hand itself in. */
const SUBMIT_HANDOFF_MS = 450;

/** Bold Readymag-style pill color per score ratio, paired with scoreBadgeClass's text color. */
/** The mark, written on the page in the pen the score deserves. */
function scoreBadgePillClass(score: number, maxScore: number): string {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.94) return `border-2 ${ACCENT_PILL.green}`;
  if (ratio >= 0.75) return `border-2 ${ACCENT_PILL.violet}`;
  return `border-2 ${ACCENT_PILL.amber}`;
}

function TimerSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="group flex items-center gap-3 text-left"
    >
      <span className="relative inline-flex shrink-0">
        <span
          className={`relative h-6 w-11 shrink-0 rounded-full border-2 transition-all duration-300 ${
            enabled
              ? "border-violet-700 bg-violet-600"
              : "border-slate-300/80 bg-white/55 dark:border-white/[0.12] dark:bg-white/[0.06]"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-90 ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </span>
        {enabled && (
          <span
            key="pulse"
            className="animate-toggle-track-pulse pointer-events-none absolute inset-0 rounded-full"
            aria-hidden
          />
        )}
        {enabled && (
          <Sparkles
            key="sparkle"
            className="animate-toggle-sparkle pointer-events-none absolute -right-1.5 -top-2.5 h-3.5 w-3.5 text-amber-300"
            aria-hidden
          />
        )}
      </span>
      <span className="text-sm text-slate-700 dark:text-slate-200">გამოაჩინე ტაიმერი</span>
    </button>
  );
}

function TestTimerBadge({ seconds }: { seconds: number }) {
  const minute = Math.floor(seconds / 60);
  const m = minute.toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  const isMinuteMark = seconds > 0 && seconds % 60 === 0;

  return (
    <div
      className={`relative mb-4 inline-flex items-center gap-2 overflow-hidden rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition-colors duration-500 ${
        isMinuteMark ? ACCENT_PILL.amber : ACCENT_PILL.violet
      }`}
    >
      <span
        key={`ring-${minute}`}
        className="animate-timer-ring-pulse pointer-events-none absolute inset-0 rounded-full"
        aria-hidden
      />
      <Timer className="animate-timer-tick h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>ტაიმერი</span>
      <span
        key={seconds}
        className="animate-timer-tick-pop font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-50"
      >
        {m}:{s}
      </span>
    </div>
  );
}

/**
 * The editor the corrected text is written into.
 *
 * A sheet of the same paper as everything else, with its own header line
 * and a footer that counts what has been written. The typewriter that used
 * to sit here was three times the height for one textarea's worth of work.
 */
function CorrectionSheet({
  value,
  onChange,
  isSubmitting,
  sourceLength,
}: {
  value: string;
  onChange: (value: string) => void;
  isSubmitting: boolean;
  sourceLength: number;
}) {
  const ratio = sourceLength > 0 ? Math.min(1, value.length / sourceLength) : 0;

  return (
    <div
      className={`exam-paper-plain overflow-hidden transition-opacity duration-300 ${
        isSubmitting ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b-2 border-dashed border-slate-300/80 px-4 py-2.5 dark:border-white/15">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          შენი ვერსია
        </span>
        <span className="text-[11px] font-bold tabular-nums text-slate-500 dark:text-slate-400">
          {value.length} / {sourceLength}
        </span>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isSubmitting}
        placeholder="ჩაწერე შესწორებული ტექსტი აქ..."
        className="min-h-[280px] w-full resize-y bg-transparent px-4 py-4 text-sm leading-[1.9] text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed dark:text-slate-200 dark:placeholder:text-slate-500"
      />

      {/* How much of the source has been carried across. */}
      <div className="h-1 w-full bg-slate-200/70 dark:bg-white/10">
        <div
          className="h-full bg-violet-500 transition-[width] duration-300 dark:bg-violet-400"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function TextEditingExercise() {
  const [isTesting, setIsTesting] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [attempts, setAttempts] = useState<TextEditingAttempt[]>(INITIAL_ATTEMPTS);
  /** The Part I task currently being worked, drawn from the past papers. */
  const [task, setTask] = useState<PastEditingTask | null>(null);
  const [correctedText, setCorrectedText] = useState("");
  const [evaluation, setEvaluation] = useState<TextEditingEvaluation | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isRollingUp, setIsRollingUp] = useState(false);

  const startTest = () => {
    // A different paper each time — the point is not to learn one text.
    const next = pickRandomEditingTask(task?.id);
    if (!next) return;
    setTask(next);
    setCorrectedText("");
    setEvaluation(null);
    setElapsedSec(0);
    setIsRollingUp(false);
    setIsTesting(true);
  };

  const stopTest = () => {
    setIsTesting(false);
    setEvaluation(null);
    setCorrectedText("");
    setIsRollingUp(false);
  };

  const copySourceToEditor = async () => {
    if (!task) return;
    setCorrectedText(task.text);
    try {
      await navigator.clipboard.writeText(task.text);
    } catch {
      /* clipboard optional */
    }
  };

  const submitForEvaluation = () => {
    if (isRollingUp || !task) return;
    const result = evaluateTextEditing(task.text, correctedText, task.points);
    setIsRollingUp(true);
    window.setTimeout(() => {
      setEvaluation(result);
      setIsRollingUp(false);
    }, SUBMIT_HANDOFF_MS);
  };

  const finishExercise = () => {
    if (evaluation) {
      const now = new Date();
      const dateLabel = now.toLocaleString("ka-GE", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const newAttempt: TextEditingAttempt = {
        id: `att-${Date.now()}`,
        dateLabel,
        preview: buildAttemptPreview(correctedText || task?.text || ""),
        score: evaluation.score,
        maxScore: evaluation.maxScore,
      };

      setAttempts((prev) => [newAttempt, ...prev]);
    }

    setIsTesting(false);
    setEvaluation(null);
    setCorrectedText("");
  };

  useEffect(() => {
    if (!isTesting || !showTimer) return;
    const id = window.setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isTesting, showTimer]);

  if (isTesting && task) {
    return (
      <div className="relative min-h-full bg-transparent px-3 py-5 sm:px-5 sm:py-7">
        <main className="notebook-paper notebook-sheet relative mx-auto w-full max-w-5xl overflow-hidden rounded-[1.75rem] px-4 py-6 sm:rounded-[2.5rem] sm:px-8 sm:py-8">
          {/* One line across the top: leave on the left, clock on the right. */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={stopTest}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-all hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
            >
              <ChevronLeft className="h-4 w-4 stroke-[2]" />
              ტესტის შეწყვეტა
            </button>
            {showTimer && <TestTimerBadge seconds={elapsedSec} />}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border-2 px-3 py-1 text-[11px] font-bold ${ACCENT_PILL.violet}`}
            >
              {paperLabel(task)} · I ნაწილი · {task.points} ქულა
            </span>
            <button
              type="button"
              onClick={copySourceToEditor}
              className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[11px] font-bold text-slate-700 transition-all dark:text-slate-200 ${PLAIN_CARD}`}
            >
              <Copy className="h-3.5 w-3.5 stroke-[2]" />
              ტექსტის გადმოტანა
            </button>
          </div>

          {/* Source on the left, your version on the right — the two things
              being compared, side by side on a screen wide enough for it. */}
          <div
            className={`grid grid-cols-1 gap-4 ${evaluation ? "" : "lg:grid-cols-2"}`}
          >
            <div className="exam-paper-plain select-none overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b-2 border-dashed border-slate-300/80 px-4 py-2.5 dark:border-white/15">
                <span className="truncate text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {task.year} · {task.variantLabel} · რედაქტირება
                </span>
                <span className="shrink-0 text-[11px] font-bold tabular-nums text-slate-500 dark:text-slate-400">
                  {task.text.length}
                </span>
              </div>
              <div className="px-4 py-4 text-sm leading-[1.9] text-slate-800 dark:text-slate-200">
                {task.text.split("\n\n").map((paragraph, index) => (
                  <p key={`p-${index}`} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {!evaluation && (
              <div className="lg:sticky lg:top-6">
                <CorrectionSheet
                  value={correctedText}
                  onChange={setCorrectedText}
                  isSubmitting={isRollingUp}
                  sourceLength={task.text.length}
                />
              </div>
            )}
          </div>

          {!evaluation && (
            <>
              <button
                type="button"
                onClick={submitForEvaluation}
                disabled={isRollingUp}
                className={`paper-sticker mt-5 flex w-full items-center justify-center gap-2 rounded-full border-2 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8 ${ACCENT_SOLID.violet}`}
              >
                <Sparkles className="h-4 w-4 stroke-[2]" />
                {isRollingUp ? "ვასწორებ..." : "გაგზავნა AI შეფასებისთვის"}
              </button>
            </>
          )}

          {evaluation && (
            <div className={`mt-6 rounded-2xl border-2 p-5 ${ACCENT_CARD.violet}`}>
              <p className={`text-2xl font-bold tracking-tight ${ACCENT_TEXT.violet}`}>
                მიღებული ქულა: {evaluation.score} / {evaluation.maxScore}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {paperLabel(task)} — შემფასებლის კრიტერიუმები
              </p>
              {/* What the paper's own marker was looking for, verbatim. */}
              <ul className="mt-3 space-y-2">
                {task.focusPoints.map((point) => (
                  <li
                    key={point}
                    className="flex gap-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                    {point}
                  </li>
                ))}
              </ul>
              <ul className="mt-4 space-y-2">
                {evaluation.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-500" />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={finishExercise}
                  className={`paper-sticker rounded-full border-2 px-5 py-2.5 text-sm font-bold ${ACCENT_SOLID.violet}`}
                >
                  სავარჯიშოს დასრულება
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-full bg-transparent px-3 py-5 sm:px-5 sm:py-7">
      <main className="notebook-paper notebook-sheet relative mx-auto w-full max-w-4xl overflow-hidden rounded-[1.75rem] px-4 py-6 sm:rounded-[2.5rem] sm:px-10 sm:py-8">
        <Sparkle
          className={`pointer-events-none absolute right-6 top-6 hidden h-4 w-4 -rotate-12 opacity-70 lg:block ${ACCENT_TEXT.violet}`}
        />
        <Sun className="pointer-events-none absolute -right-3 top-40 hidden h-12 w-12 text-amber-500/45 xl:block" />
        <Pencil className="pointer-events-none absolute -left-4 bottom-28 hidden h-11 w-11 -rotate-12 text-amber-600/45 xl:block dark:text-amber-400/35" />
        <Link
          href={GEORGIAN_HUB_HREF}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 transition-all hover:text-slate-900 dark:text-slate-50"
        >
          <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
          ქართულის ცენტრში დაბრუნება
        </Link>

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 ${ACCENT_CARD.violet} ${ACCENT_TEXT.violet}`}
          >
            <ClipboardList className="h-7 w-7 stroke-[1.5]" />
          </div>
          <div>
            <span
              className={`relative -rotate-2 inline-flex items-center rounded-full border-2 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${ACCENT_PILL.violet}`}
            >
              პირველი სავარჯიშო
              <span
                className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-violet-500"
                aria-hidden
              />
            </span>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
              ტექსტის რედაქტირება
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              ეროვნული გამოცდის <strong className="font-bold">I ნაწილი</strong> — ყოველ
              ჯერზე შემთხვევით ამოდის რეალური დავალება {TASK_COUNT} წინა წლის
              ვარიანტიდან ({YEAR_RANGE}). გაასწორე ორთოგრაფია, პუნქტუაცია და სტილი,
              შემდეგ შეადარე შემფასებლის კრიტერიუმებს.
            </p>
          </div>
        </header>

        <section className={`flex flex-col gap-4 rounded-2xl border-2 p-5 sm:flex-row sm:items-center sm:justify-between ${PLAIN_CARD}`}>
          <TimerSwitch enabled={showTimer} onChange={setShowTimer} />
          <button
            type="button"
            onClick={startTest}
            className={`flex items-center justify-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-bold paper-sticker ${ACCENT_SOLID.violet}`}
          >
            ტესტის დაწყება
            <ChevronLeft className="h-4 w-4 rotate-180 stroke-[1.5]" />
          </button>
        </section>

        <section className="mt-8" aria-label="წინა მცდელობები">
          <h2 className="mb-4 mt-8 text-lg font-bold text-slate-900 dark:text-slate-50">
            წინა მცდელობები
          </h2>
          {attempts.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              ჯერ არ გაქვს დასრულებული მცდელობა — დაიწყე ტესტი და აქ დაგროვდება.
            </p>
          ) : (
            <ul className="space-y-5">
              {attempts.map((attempt) => (
                <li key={attempt.id} className="group relative">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-3 left-0 z-0 w-9"
                  >
                    {/* Sheets fanning out from under the card on hover. */}
                    <span className="absolute inset-y-0 left-0 h-full w-full origin-bottom-left rounded-md border-2 border-violet-300/70 bg-violet-100/70 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-x-6 group-hover:-translate-y-1 group-hover:-rotate-[10deg] dark:border-violet-400/25 dark:bg-violet-400/[0.12]" />
                    <span className="absolute inset-y-0 left-0 h-full w-full origin-bottom-left rounded-md border-2 border-slate-300/80 bg-[#f2ecdc] shadow-sm transition-all delay-75 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-x-9 group-hover:translate-y-0.5 group-hover:rotate-[6deg] dark:border-white/[0.12] dark:bg-[#1d2230]" />
                    <span className="absolute inset-y-0 left-0 h-full w-full origin-bottom-left rounded-md border-2 border-slate-300/80 bg-[#faf6ec] shadow-sm transition-all delay-150 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-x-4 group-hover:translate-y-1.5 group-hover:-rotate-[3deg] dark:border-white/[0.12] dark:bg-[#161a24]" />
                  </div>

                  <div className={`relative z-10 flex flex-col gap-3 rounded-2xl border-2 p-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5 sm:flex-row sm:items-center sm:justify-between ${PLAIN_CARD}`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-600 dark:text-slate-300">{attempt.dateLabel}</p>
                      <p className="mt-1 truncate text-sm text-slate-700 dark:text-slate-200">{attempt.preview}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-3.5 py-1.5 text-sm font-bold ${scoreBadgePillClass(attempt.score, attempt.maxScore)}`}
                      >
                        {attempt.score}/{attempt.maxScore}
                      </span>
                      <button
                        type="button"
                        className={`paper-sticker rounded-full border-2 px-3.5 py-1.5 text-xs font-bold ${ACCENT_SOLID.violet}`}
                      >
                        დეტალები →
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
