"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
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
import { Pencil, Ruler, Sparkle, Sun } from "@/components/landing/notebook/Doodles";

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
const TYPEWRITER_ROLL_UP_MS = 850;
const TYPING_IDLE_MS = 700;

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

function TypewriterInput({
  value,
  onChange,
  isRollingUp,
}: {
  value: string;
  onChange: (value: string) => void;
  isRollingUp: boolean;
}) {
  const [isActive, setIsActive] = useState(false);
  const idleTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, []);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
    setIsActive(true);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIsActive(false), TYPING_IDLE_MS);
  };

  const keys = Array.from({ length: 22 }, (_, index) => ({
    index,
    x: 46 + index * ((596 - 46) / 21),
  }));
  const knobClass = isActive
    ? "animate-roller-spin"
    : isRollingUp
      ? "animate-roller-spin-fast"
      : "";

  return (
    <div className="typewriter-wrap relative mx-auto w-full max-w-2xl select-none">
      <div
        className={`typewriter-paper exam-paper-plain relative z-0 rounded-b-none px-5 pb-16 pt-6 ${isRollingUp ? "animate-paper-roll-up" : ""}`}
      >
        <div className="mb-3 flex items-center justify-between border-b-2 border-dashed border-slate-300/80 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:border-white/15 dark:text-slate-400">
          <span>spaceedu.txt</span>
          <span>{value.length} სიმბოლო</span>
        </div>
        <textarea
          value={value}
          onChange={handleChange}
          disabled={isRollingUp}
          placeholder="აქ ჩაწერე შესწორებული ტექსტი..."
          className="min-h-[220px] w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="relative z-10 -mt-12 drop-shadow-[0_20px_28px_rgba(15,23,42,0.28)] dark:drop-shadow-[0_20px_28px_rgba(0,0,0,0.5)]">
        {isActive && (
          <span
            className="animate-type-blink pointer-events-none absolute left-1/2 top-3 z-20 h-1.5 w-1.5 rounded-full bg-violet-500"
            aria-hidden
          />
        )}
        <svg viewBox="-10 -20 660 212" className="block w-full" aria-hidden>
          <defs>
            <linearGradient id="tw-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cdc6a1" />
              <stop offset="100%" stopColor="#a99f79" />
            </linearGradient>
            <radialGradient id="tw-knob" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#a49c78" />
              <stop offset="100%" stopColor="#6f6950" />
            </radialGradient>
            <linearGradient id="tw-platen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8f8865" />
              <stop offset="100%" stopColor="#6b6349" />
            </linearGradient>
            <linearGradient id="tw-deck" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8f8865" />
              <stop offset="100%" stopColor="#746c50" />
            </linearGradient>
          </defs>

          {/* paper guide tabs */}
          <rect x="108" y="-8" width="6" height="18" rx="3" fill="#8f8865" />
          <rect x="526" y="-8" width="6" height="18" rx="3" fill="#8f8865" />

          {/* platen roller bar */}
          <rect
            x="96"
            y="6"
            width="448"
            height="36"
            rx="18"
            fill="url(#tw-platen)"
            className={isActive ? "animate-feed-glow" : ""}
          />

          {/* carriage return lever */}
          <g transform="rotate(-35 582 24)">
            <rect x="578" y="-16" width="8" height="30" rx="4" fill="#5f5a44" />
            <rect x="571" y="-22" width="22" height="8" rx="4" fill="#403c30" />
          </g>

          {/* left knob */}
          <g style={{ transformOrigin: "58px 24px" }} className={knobClass}>
            <circle cx="58" cy="24" r="28" fill="url(#tw-knob)" />
            <circle cx="50" cy="16" r="7" fill="#e8e2c9" opacity="0.55" />
            {Array.from({ length: 6 }).map((_, i) => (
              <line
                key={i}
                x1="58"
                y1="4"
                x2="58"
                y2="10"
                stroke="#403c30"
                strokeWidth="2"
                transform={`rotate(${i * 60} 58 24)`}
              />
            ))}
          </g>

          {/* right knob */}
          <g style={{ transformOrigin: "582px 24px" }} className={knobClass}>
            <circle cx="582" cy="24" r="28" fill="url(#tw-knob)" />
            <circle cx="574" cy="16" r="7" fill="#e8e2c9" opacity="0.55" />
            {Array.from({ length: 6 }).map((_, i) => (
              <line
                key={i}
                x1="582"
                y1="4"
                x2="582"
                y2="10"
                stroke="#403c30"
                strokeWidth="2"
                transform={`rotate(${i * 60} 582 24)`}
              />
            ))}
          </g>

          {/* main chassis body */}
          <rect x="8" y="42" width="624" height="100" rx="20" fill="url(#tw-body)" />

          {/* brand plate */}
          <rect x="270" y="54" width="100" height="18" rx="4" fill="#efe9d2" />
          <text
            x="320"
            y="67"
            textAnchor="middle"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="700"
            letterSpacing="1"
            fill="#5f5a44"
          >
            SPACEEDU
          </text>

          {/* lower keyboard deck */}
          <rect x="8" y="132" width="624" height="48" rx="16" fill="url(#tw-deck)" />

          {/* keys */}
          {keys.map((key) => (
            <circle
              key={key.index}
              cx={key.x}
              cy="156"
              r="6.5"
              fill="#efe9d2"
              stroke="#8f8865"
              strokeWidth="1.2"
              className={isActive ? "animate-key-bounce" : ""}
              style={{
                transformOrigin: `${key.x}px 156px`,
                animationDelay: `${(key.index % 6) * 0.05}s`,
              }}
            />
          ))}
        </svg>
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
    }, TYPEWRITER_ROLL_UP_MS);
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
        <main className="notebook-paper notebook-sheet notebook-margin relative mx-auto w-full max-w-4xl overflow-hidden rounded-[1.75rem] px-4 py-6 sm:rounded-[2.5rem] sm:px-10 sm:py-8">
          <Ruler className="pointer-events-none absolute -right-4 top-24 hidden w-24 rotate-12 text-slate-400 opacity-45 xl:block dark:text-slate-500" />
          <button
            type="button"
            onClick={stopTest}
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 transition-all hover:text-slate-900 dark:text-slate-50"
          >
            <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
            ტესტის შეწყვეტა
          </button>

          {showTimer && <TestTimerBadge seconds={elapsedSec} />}

          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">
              ტექსტი შეცდომებით
            </h2>
            {/* Where this text came from — a real paper, not a mock. */}
            <span
              className={`inline-flex items-center rounded-full border-2 px-2.5 py-0.5 text-[11px] font-bold ${ACCENT_PILL.violet}`}
            >
              {paperLabel(task)} · I ნაწილი · {task.points} ქულა
            </span>
          </div>
          <div className="exam-paper-plain select-none px-5 pb-5 pt-6 font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            <div className="mb-3 flex items-center justify-between border-b-2 border-dashed border-slate-300/80 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:border-white/15 dark:text-slate-400">
              <span>wyaro.txt</span>
              <span>{task.text.length} სიმბოლო</span>
            </div>
            {task.text.split("\n\n").map((paragraph, index) => (
              <p key={`p-${index}`} className="mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>

          <button
            type="button"
            onClick={copySourceToEditor}
            className={`mb-3 mr-auto mt-3 flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-xs font-bold text-slate-700 transition-all dark:text-slate-200 ${PLAIN_CARD}`}
          >
            <Copy className="h-3.5 w-3.5 stroke-[1.5]" />
            რედაქტორში გადმოყვანა
          </button>

          {!evaluation && (
            <>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-slate-900 dark:text-slate-50">თქვენი შესწორებული ტექსტი</h2>
              </div>

              <TypewriterInput
                value={correctedText}
                onChange={setCorrectedText}
                isRollingUp={isRollingUp}
              />

              <button
                type="button"
                onClick={submitForEvaluation}
                disabled={isRollingUp}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8 paper-sticker ${ACCENT_SOLID.violet}`}
              >
                <Sparkles className="h-4 w-4 stroke-[1.5]" />
                {isRollingUp ? "ფურცელი იხვევა..." : "გაგზავნა AI შეფასებისთვის"}
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
      <main className="notebook-paper notebook-sheet notebook-margin relative mx-auto w-full max-w-4xl overflow-hidden rounded-[1.75rem] px-4 py-6 sm:rounded-[2.5rem] sm:px-10 sm:py-8">
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
