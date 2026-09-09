"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Flame } from "lucide-react";
import { Sparkle } from "@/components/landing/notebook/Doodles";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_TEXT,
  type NotebookAccent,
} from "@/components/landing/notebook/accents";

/**
 * The light touch of play inside a timed exam.
 *
 * The rule these follow: while the clock is running nothing may pull the
 * eye away from the question, so the reward is small, fast and off to the
 * side. The loud version waits for the results screen, where there is
 * nothing left to concentrate on.
 */

/** "3 ზედიზედ სწორი" — only from two in a row, and never in the way. */
export function ComboBadge({ streak }: { streak: number }) {
  return (
    <AnimatePresence>
      {streak >= 2 && (
        <motion.span
          key={streak}
          initial={{ opacity: 0, scale: 0.85, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-400/70 bg-amber-100/70 px-3 py-1 text-[11px] font-bold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"
        >
          <Flame className="h-3 w-3 stroke-[2.5]" aria-hidden />
          {streak} ზედიზედ სწორი
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/**
 * A checkmark that pops once in the corner of the question card when the
 * answer was right, then leaves. Keyed by the question so it replays.
 */
export function CorrectPop({
  show,
  accent,
  triggerKey,
}: {
  show: boolean;
  accent: NotebookAccent;
  triggerKey: string;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          key={triggerKey}
          initial={{ opacity: 0, scale: 0.4, rotate: -12 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute right-4 top-4 z-[2]"
          aria-hidden
        >
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${ACCENT_CARD.green} ${ACCENT_TEXT.green}`}
          >
            <Check className="h-4 w-4 stroke-[3]" />
          </span>
          <Sparkle
            className={`animate-star-twinkle absolute -right-1 -top-1 h-3 w-3 ${ACCENT_TEXT[accent]}`}
          />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/**
 * The question progress bar: one solid segment per question — no gradient,
 * as everywhere else in the app — with a small star over the ones already
 * answered correctly.
 */
export function QuestionProgress({
  total,
  index,
  stateFor,
  onJump,
  accent,
}: {
  total: number;
  index: number;
  stateFor: (i: number) => "correct" | "wrong" | "current" | "todo";
  onJump: (i: number) => void;
  accent: NotebookAccent;
}) {
  return (
    <div className="mb-6 flex items-end gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const state = stateFor(i);
        const reachable = state !== "todo" || i <= index;
        const bar =
          state === "correct"
            ? "bg-emerald-500 dark:bg-emerald-400"
            : state === "wrong"
              ? "bg-pink-500 dark:bg-pink-400"
              : state === "current"
                ? "bg-slate-400 dark:bg-white/40"
                : "bg-slate-200 dark:bg-white/[0.08]";
        return (
          <button
            key={i}
            type="button"
            disabled={!reachable}
            onClick={() => onJump(i)}
            aria-label={`კითხვა ${i + 1}`}
            aria-current={i === index ? "step" : undefined}
            className="relative flex flex-1 flex-col items-center gap-1 disabled:cursor-not-allowed"
          >
            {state === "correct" && (
              <Sparkle
                className={`h-2.5 w-2.5 ${ACCENT_TEXT[accent]}`}
                aria-hidden
              />
            )}
            <span className={`block h-1.5 w-full rounded-full transition-colors duration-300 ${bar}`} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * The results screen's celebration: a star burst behind the score, and the
 * run written up as a finished quest.
 */
export function QuestComplete({
  accent,
  title,
  subtitle,
  score,
  total,
  stats,
}: {
  accent: NotebookAccent;
  title: string;
  subtitle: string;
  score: number;
  total: number;
  stats: { label: string; value: string }[];
}) {
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 p-6 text-center sm:p-8 ${ACCENT_CARD[accent]}`}>
      {[
        { left: "12%", top: "18%", delay: 0 },
        { left: "82%", top: "14%", delay: 0.12 },
        { left: "26%", top: "72%", delay: 0.24 },
        { left: "74%", top: "68%", delay: 0.36 },
        { left: "50%", top: "8%", delay: 0.48 },
      ].map((star) => (
        <motion.span
          key={`${star.left}-${star.top}`}
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: [0, 1, 0.55], scale: [0.2, 1.15, 1] }}
          transition={{ duration: 0.8, delay: 0.2 + star.delay, ease: "easeOut" }}
          className="pointer-events-none absolute"
          style={{ left: star.left, top: star.top }}
          aria-hidden
        >
          <Sparkle className={`h-4 w-4 ${ACCENT_TEXT[accent]}`} />
        </motion.span>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider ${ACCENT_PILL[accent]}`}
        >
          დავალება შესრულებულია
        </span>
        <h2 className="headline mt-4 text-2xl font-bold text-slate-900 dark:text-slate-50">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>

        <motion.p
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 text-5xl font-black text-slate-900 dark:text-slate-50"
        >
          {score}
          <span className="text-2xl font-bold text-slate-500 dark:text-slate-400">/{total}</span>
        </motion.p>
        <p className={`mt-1 text-sm font-bold ${ACCENT_TEXT[accent]}`}>{percent}% სისწორე</p>

        {stats.length > 0 && (
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border-2 border-slate-300/70 bg-white/55 px-4 py-3 dark:border-white/[0.12] dark:bg-white/[0.04]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-50">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
