"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import {
  buildExamRun,
  type ExamVariant,
  type ExamRunStep,
} from "@/data/pastExamsData";
import {
  EXAM_CATEGORY_META,
  isTropeCategory,
  type ExamCategory,
} from "@/lib/exam-categories";
import { recordCategoryAttempt } from "@/lib/category-accuracy";
import { recordQuestProgress } from "@/lib/daily-quests";
import { recordQuizResult } from "@/lib/dashboard-metrics";
import { recordDailyActivity } from "@/lib/daily-streak";
import { TropeHighlightedPassage } from "./TropeHighlightedPassage";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

interface PastExamRunnerProps {
  subjectId: string;
  subjectTitle: string;
  year: number;
  variant: ExamVariant;
  onExit: () => void;
}

interface AnswerRecord {
  questionId: string;
  category: ExamCategory;
  correct: boolean;
}

export function PastExamRunner({
  subjectId,
  subjectTitle,
  year,
  variant,
  onExit,
}: PastExamRunnerProps) {
  const run: ExamRunStep[] = useMemo(() => buildExamRun(variant), [variant]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [finished, setFinished] = useState(false);
  /** Question the student is hovering in the rail — drives the highlighter. */
  const [previewHighlight, setPreviewHighlight] = useState<string | null>(null);

  const step = run[index];
  const total = run.length;
  const correctCount = answers.filter((a) => a.correct).length;
  const isLast = index >= total - 1;

  const activeHighlight = previewHighlight ?? step?.question.highlightPhrase;

  const check = useCallback(() => {
    if (selected === null || revealed || !step) return;
    const correct = selected === step.question.correctIndex;
    setRevealed(true);
    setAnswers((prev) => [
      ...prev,
      { questionId: step.question.id, category: step.question.category, correct },
    ]);
    recordCategoryAttempt(step.question.category, correct);
  }, [selected, revealed, step]);

  const advance = useCallback(() => {
    if (!revealed) return;
    if (isLast) {
      const finalAnswers = answers;
      const correct = finalAnswers.filter((a) => a.correct).length;
      recordQuizResult(correct, total, subjectTitle);
      recordQuestProgress("solve-test", 1);
      recordDailyActivity();
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setSelected(null);
    setRevealed(false);
    setPreviewHighlight(null);
  }, [revealed, isLast, answers, total, subjectTitle]);

  const restart = useCallback(() => {
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setAnswers([]);
    setFinished(false);
    setPreviewHighlight(null);
  }, []);

  /* ------------------------------ completion ----------------------------- */
  if (finished) {
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const byCategory = answers.reduce<Record<string, { correct: number; total: number }>>(
      (acc, answer) => {
        const bucket = acc[answer.category] ?? { correct: 0, total: 0 };
        acc[answer.category] = {
          correct: bucket.correct + (answer.correct ? 1 : 0),
          total: bucket.total + 1,
        };
        return acc;
      },
      {},
    );

    return (
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-[#0D0D15]/80 p-6 backdrop-blur-xl sm:p-8"
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan-400/40 bg-cyan-500/10">
            <CircleCheck className="h-8 w-8 text-cyan-300" strokeWidth={1.75} />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">ვარიანტი დასრულებულია</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {subjectTitle} · {year} · {variant.label}
          </p>
          <p className="mt-6 text-5xl font-black text-white">
            {correctCount}
            <span className="text-2xl font-bold text-zinc-500">/{total}</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-cyan-300">{percent}% სისწორე</p>
        </div>

        <div className="mt-8">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            კატეგორიების ჭრილში
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(byCategory).map(([category, tally]) => {
              const meta = EXAM_CATEGORY_META[category as ExamCategory];
              const rate = Math.round((tally.correct / tally.total) * 100);
              return (
                <div
                  key={category}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                >
                  <span className="text-sm text-zinc-300">{meta.label}</span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: rate >= 70 ? "#34d399" : meta.accent }}
                  >
                    {tally.correct}/{tally.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-bold text-[#04141a] transition hover:bg-cyan-400"
          >
            <RefreshCw className="h-4 w-4 stroke-[2]" />
            თავიდან
          </button>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-white/30 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 stroke-[1.75]" />
            არქივში დაბრუნება
          </button>
          <Link
            href={`/subject/${subjectId}/essay-grader`}
            className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-5 py-2.5 text-sm font-semibold text-violet-200 transition hover:border-violet-400/50"
          >
            <Sparkles className="h-4 w-4 stroke-[1.75]" />
            ესეს შეფასება
          </Link>
        </div>
      </motion.section>
    );
  }

  if (!step) return null;

  const { passage, question } = step;
  const categoryMeta = EXAM_CATEGORY_META[question.category];
  const progressPercent = Math.round(((index + (revealed ? 1 : 0)) / total) * 100);
  const isCorrect = revealed && selected === question.correctIndex;

  return (
    <div className="space-y-4">
      {/* ------------------------------- top bar ------------------------------ */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[2]" />
          არქივი
        </button>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold text-white/70">
            {year} · {variant.label}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
            <Target className="h-3 w-3 stroke-[2]" />
            {correctCount}/{answers.length || 0}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        {/* ---------------------- LEFT: reading panel ---------------------- */}
        <section
          aria-label="საკითხავი ტექსტი"
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0D0D15]/80 p-6 backdrop-blur-xl"
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-[0.08] blur-3xl"
            style={{ background: "radial-gradient(circle, #06B6D4 0%, transparent 70%)" }}
            aria-hidden
          />
          <div className="relative z-[1]">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                ეროვნული გამოცდა · {year}
              </span>
              <span className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold text-zinc-400">
                {passage.authorOrSource}
              </span>
            </div>

            <h2 className="mb-5 text-xl font-bold leading-tight text-white sm:text-2xl">
              {passage.title}
            </h2>

            <TropeHighlightedPassage
              text={passage.textExcerpt}
              highlight={activeHighlight}
              intensity={previewHighlight ? "strong" : "soft"}
            />

            {activeHighlight && (
              <p className="mt-6 flex items-start gap-2 rounded-lg border border-cyan-500/15 bg-cyan-500/[0.04] px-3 py-2 text-[11px] leading-relaxed text-cyan-200/80">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 stroke-[1.75]" />
                ხაზგასმულია მონაკვეთი, რომელსაც კითხვა ეხება.
              </p>
            )}
          </div>
        </section>

        {/* ------------------- RIGHT: question wizard ---------------------- */}
        <section
          aria-label="კითხვების ვიზარდი"
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0D0D15]/80 p-6 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">
              კითხვა {index + 1} / {total}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold ${categoryMeta.badgeClass}`}
            >
              {isTropeCategory(question.category) && (
                <Sparkles className="h-3 w-3 stroke-[2]" />
              )}
              {categoryMeta.label}
            </span>
          </div>

          {/* progress bar */}
          <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>

          <p
            className="mb-5 text-[15px] font-semibold leading-relaxed text-white"
            onMouseEnter={() => question.highlightPhrase && setPreviewHighlight(question.highlightPhrase)}
            onMouseLeave={() => setPreviewHighlight(null)}
          >
            {question.questionText}
          </p>

          <div className="space-y-2.5">
            {question.options.map((option, optionIndex) => {
              const isChosen = selected === optionIndex;
              const isAnswer = optionIndex === question.correctIndex;

              let stateClass =
                "border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:border-cyan-400/40 hover:bg-cyan-500/[0.06]";
              if (revealed && isAnswer) {
                stateClass =
                  "border-emerald-400/50 bg-emerald-500/10 text-emerald-100 shadow-[0_0_16px_rgba(52,211,153,0.18)]";
              } else if (revealed && isChosen) {
                stateClass = "border-rose-400/50 bg-rose-500/10 text-rose-100";
              } else if (isChosen) {
                stateClass = "border-cyan-400/60 bg-cyan-500/10 text-white";
              }

              return (
                <button
                  key={option}
                  type="button"
                  disabled={revealed}
                  onClick={() => setSelected(optionIndex)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm leading-relaxed transition-all disabled:cursor-default ${stateClass}`}
                >
                  <span
                    className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold ${
                      revealed && isAnswer
                        ? "border-emerald-400/60 text-emerald-200"
                        : revealed && isChosen
                          ? "border-rose-400/60 text-rose-200"
                          : isChosen
                            ? "border-cyan-400/60 text-cyan-200"
                            : "border-white/15 text-white/50"
                    }`}
                  >
                    {revealed && isAnswer ? (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : revealed && isChosen ? (
                      <X className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : (
                      OPTION_LETTERS[optionIndex]
                    )}
                  </span>
                  <span className="min-w-0 flex-1">{option}</span>
                </button>
              );
            })}
          </div>

          {/* ------------------------- feedback state ----------------------- */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-5">
                  <p
                    className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
                      isCorrect
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-rose-500/15 text-rose-300"
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <Check className="h-3 w-3 stroke-[2.5]" />
                        სწორია
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 stroke-[2.5]" />
                        არასწორია
                      </>
                    )}
                  </p>
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-4">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      <Lightbulb className="h-3 w-3 stroke-[2]" />
                      ახსნა
                    </p>
                    <p className="text-[13.5px] leading-relaxed text-cyan-50/85">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* --------------------------- action row ------------------------- */}
          <div className="mt-6">
            {!revealed ? (
              <button
                type="button"
                onClick={check}
                disabled={selected === null}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-[#04141a] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
              >
                პასუხის შემოწმება
              </button>
            ) : (
              <button
                type="button"
                onClick={advance}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-zinc-200"
              >
                {isLast ? "შედეგების ნახვა" : "შემდეგი კითხვა"}
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
