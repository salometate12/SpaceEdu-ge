"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CircleCheck,
  Lightbulb,
  PenLine,
  RefreshCw,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import {
  buildExamRun,
  type ExamEditingTask,
  type ExamPassage,
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
  /**
   * Real papers offer two texts and the student answers on ONE. Until a
   * choice is made we show the chooser; older seed variants run every
   * passage in sequence and skip this step entirely.
   */
  const [chosenPassageId, setChosenPassageId] = useState<string | null>(
    variant.choosePassage ? null : "__all__",
  );

  const activeVariant: ExamVariant = useMemo(() => {
    if (!variant.choosePassage || chosenPassageId === null) return variant;
    const picked = variant.passages.find((p) => p.id === chosenPassageId);
    return picked ? { ...variant, passages: [picked] } : variant;
  }, [variant, chosenPassageId]);

  const run: ExamRunStep[] = useMemo(
    () => buildExamRun(activeVariant),
    [activeVariant],
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [finished, setFinished] = useState(false);
  const [showEditing, setShowEditing] = useState(false);
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
    if (variant.choosePassage) setChosenPassageId(null);
  }, [variant.choosePassage]);

  const chosenPassage: ExamPassage | undefined =
    variant.choosePassage && chosenPassageId
      ? variant.passages.find((p) => p.id === chosenPassageId)
      : variant.passages[0];

  /* -------------------------- Part I — რედაქტირება ------------------------ */
  if (showEditing && variant.editingTask) {
    return (
      <EditingTaskPanel
        year={year}
        variantLabel={variant.label}
        task={variant.editingTask}
        onBack={() => setShowEditing(false)}
      />
    );
  }

  /* ------------------------- text chooser (Part II) ----------------------- */
  if (variant.choosePassage && chosenPassageId === null) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[2]" />
            არქივი
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold text-white/70">
            {year} · {variant.label}
          </span>
        </div>

        {variant.editingTask && (
          <button
            type="button"
            onClick={() => setShowEditing(true)}
            className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-amber-500/25 bg-amber-950/20 p-5 text-left transition hover:border-amber-400/45"
          >
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                <PenLine className="h-3 w-3 stroke-[2]" />
                I ნაწილი · {variant.editingTask.points} ქულა
              </span>
              <h3 className="mt-2 text-base font-semibold text-white">
                ტექსტის რედაქტირება
              </h3>
              <p className="mt-0.5 text-xs text-zinc-400">
                გაასწორე შეცდომები და გადაწერე ტექსტი შინაარსის შეცვლის გარეშე.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-amber-300 transition group-hover:translate-x-0.5" />
          </button>
        )}

        <section
          aria-label="ტექსტის არჩევა"
          className="rounded-2xl border border-white/10 bg-[#0D0D15]/80 p-6 backdrop-blur-xl"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
            <BookOpen className="h-3 w-3 stroke-[2]" />
            II ნაწილი · წაკითხულის გააზრება
          </span>
          <h2 className="mt-3 text-xl font-bold text-white">
            აირჩიე ერთ-ერთი ტექსტი
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            დავალებები მხოლოდ არჩეული ტექსტის მიხედვით სრულდება — ისე, როგორც
            რეალურ გამოცდაზე.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {variant.passages.map((passage, passageIndex) => (
              <motion.button
                key={passage.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: passageIndex * 0.06, duration: 0.28 }}
                onClick={() => {
                  setChosenPassageId(passage.id);
                  setIndex(0);
                  setSelected(null);
                  setRevealed(false);
                  setAnswers([]);
                }}
                className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-cyan-400/40"
              >
                <span className="inline-flex rounded-full border-2 border-cyan-500/30 bg-cyan-500/[0.06] px-3 py-1 text-[11px] font-bold text-cyan-300">
                  {passage.choiceLabel ?? `ტექსტი ${passageIndex + 1}`}
                </span>
                <h3 className="mt-3 text-base font-semibold text-white">
                  {passage.title}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">{passage.authorOrSource}</p>
                <p className="mt-3 text-[11px] font-medium text-zinc-500">
                  {passage.questions.length} კითხვა
                  {passage.essay ? ` · ესე ${passage.essay.points} ქულა` : ""}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                  დაიწყე
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </motion.button>
            ))}
          </div>
        </section>
      </div>
    );
  }

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

        {chosenPassage?.essay && (
          <div className="mt-8 rounded-2xl border border-violet-500/25 bg-violet-950/20 p-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">
              <PenLine className="h-3 w-3 stroke-[2]" />
              წერითი დავალება · {chosenPassage.essay.points} ქულა
            </span>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-violet-50/85">
              {chosenPassage.essay.prompt}
            </p>
            <Link
              href={`/subject/${subjectId}/essay-grader?prompt=${encodeURIComponent(
                chosenPassage.essay.prompt,
              )}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-violet-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-400"
            >
              <Sparkles className="h-4 w-4 stroke-[2]" />
              დაწერე და შეაფასებინე
            </Link>
          </div>
        )}

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
              preserveLines={passage.kind === "poem"}
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

/* -------------------------------------------------------------------------- */
/*                        PART I — ტექსტის რედაქტირება                        */
/* -------------------------------------------------------------------------- */

function EditingTaskPanel({
  year,
  variantLabel,
  task,
  onBack,
}: {
  year: number;
  variantLabel: string;
  task: ExamEditingTask;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [showKey, setShowKey] = useState(false);
  const words = draft.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[2]" />
          ვარიანტის დავალებები
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-300">
          {year} · {variantLabel} · {task.points} ქულა
        </span>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-6">
        <section className="rounded-2xl border border-white/10 bg-[#0D0D15]/80 p-6 backdrop-blur-xl">
          <h2 className="text-lg font-bold text-white">ტექსტის რედაქტირება</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            გაასწორე მორფოლოგიურ-ორთოგრაფიული, სინტაქსური და პუნქტუაციური
            შეცდომები და სტილისტიკური ხარვეზები. შინაარსი არ შეცვალო.
          </p>
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="whitespace-pre-line text-[14.5px] leading-[1.95] text-zinc-200">
              {task.text}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0D0D15]/80 p-6 backdrop-blur-xl">
          <label className="block">
            <span className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              <span>შენი გასწორებული ვერსია</span>
              <span className="text-zinc-600">{words} სიტყვა</span>
            </span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="გადაწერე მთელი ტექსტი გასწორებული სახით..."
              className="min-h-[360px] w-full resize-y rounded-xl border border-white/10 bg-[#08080d]/80 p-4 text-[14.5px] leading-[1.9] text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-amber-400/50"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowKey((value) => !value)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-5 py-3 text-sm font-bold text-[#241a02] transition hover:bg-amber-400"
          >
            {showKey ? "დამალე შესამოწმებელი პუნქტები" : "შემოწმების პუნქტები"}
          </button>

          <AnimatePresence>
            {showKey && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/25 p-4">
                  <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    <Lightbulb className="h-3 w-3 stroke-[2]" />
                    რას ამოწმებს გამსწორებელი
                  </p>
                  <ul className="space-y-2">
                    {task.focusPoints.map((point) => (
                      <li
                        key={point}
                        className="flex gap-2 text-[13px] leading-relaxed text-amber-50/85"
                      >
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
