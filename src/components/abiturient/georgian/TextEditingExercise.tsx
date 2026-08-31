"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ChevronLeft,
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
  scoreBadgeClass,
  type TextEditingAttempt,
  type TextEditingEvaluation,
} from "@/lib/georgian-text-editing";

const GEORGIAN_HUB_HREF = "/subject/georgian/space";
const TYPEWRITER_ROLL_UP_MS = 850;
const TYPING_IDLE_MS = 700;

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

  return (
    <div className="typewriter-wrap relative mx-auto w-full max-w-2xl select-none [perspective:900px]">
      <div className="relative rounded-t-2xl border border-white/10 bg-gradient-to-b from-zinc-800 to-zinc-900 px-5 pt-4 pb-5 shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <span
            className={`h-5 w-5 rounded-full border-2 border-zinc-500 bg-zinc-700 ${isActive ? "animate-roller-spin" : isRollingUp ? "animate-roller-spin-fast" : ""}`}
            aria-hidden
          />
          <span
            className={`h-2 max-w-[160px] flex-1 rounded-full bg-purple-500/60 ${isActive ? "animate-feed-glow" : ""}`}
            aria-hidden
          />
          <span
            className={`h-5 w-5 rounded-full border-2 border-zinc-500 bg-zinc-700 ${isActive ? "animate-roller-spin" : isRollingUp ? "animate-roller-spin-fast" : ""}`}
            aria-hidden
          />
        </div>
        {isActive && (
          <span
            className="animate-type-blink pointer-events-none absolute left-1/2 top-1.5 h-1.5 w-1.5 rounded-full bg-purple-400"
            aria-hidden
          />
        )}
      </div>

      <div
        className={`typewriter-paper relative -mt-1 border border-amber-100/10 bg-[#f4ecd8] px-5 pt-6 pb-5 shadow-[0_18px_40px_rgba(0,0,0,0.45)] ${isRollingUp ? "animate-paper-roll-up" : ""}`}
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

      <div className="flex justify-center gap-1 rounded-b-2xl border border-t-0 border-white/10 bg-zinc-900 px-4 py-2.5">
        {Array.from({ length: 24 }).map((_, index) => (
          <span
            key={index}
            className={`h-1.5 w-1.5 rounded-full bg-zinc-700 ${isActive ? "animate-key-bounce" : ""}`}
            style={{ animationDelay: `${(index % 6) * 0.05}s` }}
            aria-hidden
          />
        ))}
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
          <div className="select-none rounded-xl border border-white/[0.06] bg-[#16161a]/80 p-5 font-mono text-sm leading-relaxed text-white/90">
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

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">ტექსტის რედაქტირება</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
            ეროვნული გამოცდის სტანდარტის მიხედვით შეასწორე ტექსტი და მიიღე შეფასება
            16-ბალიანი სკალით.
          </p>
        </header>

        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TimerSwitch enabled={showTimer} onChange={setShowTimer} />
          <button
            type="button"
            onClick={startTest}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
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
            <ul className="space-y-3">
              {attempts.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-[#121214]/40 p-4 backdrop-blur-md transition-all hover:border-white/[0.1] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">{attempt.dateLabel}</p>
                    <p className="mt-1 truncate text-sm text-zinc-300">{attempt.preview}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <span
                      className={`rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-1 text-sm ${scoreBadgeClass(attempt.score, attempt.maxScore)}`}
                    >
                      {attempt.score}/{attempt.maxScore}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-purple-400 transition hover:text-purple-300 hover:underline"
                    >
                      დეტალების ნახვა →
                    </button>
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
