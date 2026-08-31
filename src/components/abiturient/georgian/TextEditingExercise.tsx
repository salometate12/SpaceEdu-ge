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
  TEXT_EDITING_MAX_SCORE,
  buildAttemptPreview,
  evaluateTextEditing,
  pickRandomSourceText,
  type TextEditingAttempt,
  type TextEditingEvaluation,
} from "@/lib/georgian-text-editing";

const GEORGIAN_HUB_HREF = "/subject/georgian/space";
const TYPEWRITER_ROLL_UP_MS = 850;
const TYPING_IDLE_MS = 700;

/** Bold Readymag-style pill color per score ratio, paired with scoreBadgeClass's text color. */
function scoreBadgePillClass(score: number, maxScore: number): string {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.94) return "border-transparent bg-emerald-400 text-black";
  if (ratio >= 0.75) return "border-[3px] border-purple-400 bg-transparent text-purple-300";
  return "border-[3px] border-amber-400 bg-transparent text-amber-300";
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
          className={`relative h-6 w-11 shrink-0 rounded-full border transition-all duration-300 ${
            enabled
              ? "border-purple-500/60 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_14px_rgba(168,85,247,0.55)]"
              : "border-white/[0.12] bg-white/[0.06]"
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
      <span className="text-sm text-zinc-300">გამოაჩინე ტაიმერი</span>
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
      className={`relative mb-4 inline-flex items-center gap-2 overflow-hidden rounded-full border px-3.5 py-1.5 text-xs transition-colors duration-500 ${
        isMinuteMark
          ? "border-amber-400/60 bg-amber-500/10"
          : "border-purple-500/25 bg-purple-500/[0.06]"
      }`}
    >
      <span
        key={`ring-${minute}`}
        className="animate-timer-ring-pulse pointer-events-none absolute inset-0 rounded-full"
        aria-hidden
      />
      <Timer className="animate-timer-tick h-3.5 w-3.5 shrink-0 text-purple-400" aria-hidden />
      <span className="text-purple-300">ტაიმერი</span>
      <span
        key={seconds}
        className="animate-timer-tick-pop font-mono font-semibold tabular-nums text-white"
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
        className={`typewriter-paper relative z-0 rounded-t-md border border-amber-100/10 bg-[#f4ecd8] px-5 pt-6 pb-16 shadow-[0_18px_40px_rgba(0,0,0,0.45)] ${isRollingUp ? "animate-paper-roll-up" : ""}`}
      >
        <div className="mb-3 flex items-center justify-between border-b border-dashed border-zinc-400/50 pb-2 text-[10px] uppercase tracking-widest text-zinc-500">
          <span>spaceedu.txt</span>
          <span>{value.length} სიმბოლო</span>
        </div>
        <textarea
          value={value}
          onChange={handleChange}
          disabled={isRollingUp}
          placeholder="აქ ჩაწერე შესწორებული ტექსტი..."
          className="min-h-[220px] w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
        />
      </div>

      <div className="relative z-10 -mt-12 drop-shadow-[0_20px_28px_rgba(0,0,0,0.5)]">
        {isActive && (
          <span
            className="animate-type-blink pointer-events-none absolute left-1/2 top-3 z-20 h-1.5 w-1.5 rounded-full bg-purple-400"
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
  const [sourceText, setSourceText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [evaluation, setEvaluation] = useState<TextEditingEvaluation | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isRollingUp, setIsRollingUp] = useState(false);

  const startTest = () => {
    setSourceText(pickRandomSourceText());
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
    setCorrectedText(sourceText);
    try {
      await navigator.clipboard.writeText(sourceText);
    } catch {
      /* clipboard optional */
    }
  };

  const submitForEvaluation = () => {
    if (isRollingUp) return;
    const result = evaluateTextEditing(sourceText, correctedText);
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
        preview: buildAttemptPreview(correctedText || sourceText),
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

  if (isTesting) {
    return (
      <div className="relative min-h-full bg-transparent">
        <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <button
            type="button"
            onClick={stopTest}
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-gray-400 transition-all hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
            ტესტის შეწყვეტა
          </button>

          {showTimer && <TestTimerBadge seconds={elapsedSec} />}

          <div className="mb-2">
            <h2 className="text-sm font-medium text-gray-400">ტექსტი შეცდომებით</h2>
          </div>
          <div className="select-none rounded-t-md border border-amber-100/10 bg-[#f4ecd8] px-5 pb-5 pt-6 font-mono text-sm leading-relaxed text-zinc-800 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
            <div className="mb-3 flex items-center justify-between border-b border-dashed border-zinc-400/50 pb-2 text-[10px] uppercase tracking-widest text-zinc-500">
              <span>wyaro.txt</span>
              <span>{sourceText.length} სიმბოლო</span>
            </div>
            {sourceText.split("\n\n").map((paragraph, index) => (
              <p key={`p-${index}`} className="mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>

          <button
            type="button"
            onClick={copySourceToEditor}
            className="mb-3 mr-auto mt-3 flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs text-white/90 transition-all hover:bg-white/[0.08]"
          >
            <Copy className="h-3.5 w-3.5 stroke-[1.5]" />
            რედაქტორში გადმოყვანა
          </button>

          {!evaluation && (
            <>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-white">თქვენი შესწორებული ტექსტი</h2>
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
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-medium text-white shadow-lg shadow-purple-500/15 transition-all hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
              >
                <Sparkles className="h-4 w-4 stroke-[1.5]" />
                {isRollingUp ? "ფურცელი იხვევა..." : "გაგზავნა AI შეფასებისთვის"}
              </button>
            </>
          )}

          {evaluation && (
            <div className="mt-6 rounded-xl border border-purple-500/20 bg-purple-950/10 p-5">
              <p className="text-2xl font-bold tracking-tight text-purple-400">
                მიღებული ქულა: {evaluation.score} / {evaluation.maxScore}
              </p>
              <ul className="mt-4 space-y-2">
                {evaluation.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-2 text-sm leading-relaxed text-zinc-300"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-purple-400" />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={finishExercise}
                  className="rounded-xl border border-purple-500/30 bg-purple-600/20 px-5 py-2.5 text-sm font-medium text-purple-200 transition-all hover:bg-purple-600/30"
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
    <div className="relative min-h-full bg-transparent">
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href={GEORGIAN_HUB_HREF}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-gray-400 transition-all hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
          ქართულის ცენტრში დაბრუნება
        </Link>

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-purple-500/30 bg-purple-500/10 text-purple-300 shadow-[0_0_28px_rgba(168,85,247,0.22)]">
            <ClipboardList className="h-7 w-7 stroke-[1.5]" />
          </div>
          <div>
            <span className="relative -rotate-2 inline-flex items-center rounded-full border-2 border-purple-500/30 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/90">
              პირველი სავარჯიშო
              <span
                className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.6)]"
                aria-hidden
              />
            </span>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">ტექსტის რედაქტირება</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
              ეროვნული გამოცდის სტანდარტის მიხედვით შეასწორე ტექსტი და მიიღე შეფასება
              16-ბალიანი სკალით.
            </p>
          </div>
        </header>

        <section className="flex flex-col gap-4 rounded-[28px] border-2 border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
          <TimerSwitch enabled={showTimer} onChange={setShowTimer} />
          <button
            type="button"
            onClick={startTest}
            className="flex items-center justify-center gap-2 rounded-full border-2 border-transparent bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            ტესტის დაწყება
            <ChevronLeft className="h-4 w-4 rotate-180 stroke-[1.5]" />
          </button>
        </section>

        <section className="mt-8" aria-label="წინა მცდელობები">
          <h2 className="mb-4 mt-8 text-lg font-semibold text-white/80">წინა მცდელობები</h2>
          {attempts.length === 0 ? (
            <p className="text-sm text-zinc-500">ჯერ არ გაქვს დასრულებული მცდელობა.</p>
          ) : (
            <ul className="space-y-5">
              {attempts.map((attempt) => (
                <li key={attempt.id} className="group relative">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-3 left-0 z-0 w-9"
                  >
                    <span className="absolute inset-y-0 left-0 h-full w-full origin-bottom-left rounded-md bg-gradient-to-br from-purple-800/70 to-indigo-900/70 shadow-md transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-x-6 group-hover:-translate-y-1 group-hover:-rotate-[10deg]" />
                    <span className="absolute inset-y-0 left-0 h-full w-full origin-bottom-left rounded-md bg-[#e8ddb8] shadow-md transition-all delay-75 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-x-9 group-hover:translate-y-0.5 group-hover:rotate-[6deg]" />
                    <span className="absolute inset-y-0 left-0 h-full w-full origin-bottom-left rounded-md bg-[#f2e2c8] shadow-md transition-all delay-150 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-x-4 group-hover:translate-y-1.5 group-hover:-rotate-[3deg]" />
                  </div>

                  <div className="relative z-10 flex flex-col gap-3 rounded-[24px] border-2 border-white/10 bg-[#121214]/70 p-4 backdrop-blur-md transition-all duration-300 ease-out group-hover:translate-x-1.5 group-hover:border-purple-400/30 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">{attempt.dateLabel}</p>
                      <p className="mt-1 truncate text-sm text-zinc-300">{attempt.preview}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-3.5 py-1.5 text-sm font-bold ${scoreBadgePillClass(attempt.score, attempt.maxScore)}`}
                      >
                        {attempt.score}/{attempt.maxScore}
                      </span>
                      <button
                        type="button"
                        className="rounded-full border-[3px] border-transparent bg-purple-500 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-purple-400"
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
