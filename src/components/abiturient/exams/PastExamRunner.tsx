"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
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

import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_SOLID,
  ACCENT_TEXT,
  PLAIN_CARD,
  type NotebookAccent,
} from "@/components/landing/notebook/accents";
import { Sparkle } from "@/components/landing/notebook/Doodles";
import { ComboBadge, CorrectPop, QuestComplete } from "./ExamGamification";

/** Solid fills, never gradients — the rule the dashboard tools already follow. */
const PROGRESS_FILL: Record<NotebookAccent, string> = {
  blue: "bg-sky-500 dark:bg-sky-400",
  green: "bg-emerald-500 dark:bg-emerald-400",
  pink: "bg-pink-500 dark:bg-pink-400",
  amber: "bg-amber-500 dark:bg-amber-400",
  violet: "bg-violet-500 dark:bg-violet-400",
};

const PANEL = "notebook-paper notebook-sheet rounded-[26px]";

interface PastExamRunnerProps {
  subjectId: string;
  subjectTitle: string;
  /** The subject's notebook pen colour, carried in from the archive. */
  accent: NotebookAccent;
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
  accent,
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
  /* Per-question state, so stepping back restores exactly what was there. */
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  /** How many right answers in a row — the only score shown mid-run. */
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [finished, setFinished] = useState(false);
  const [showEditing, setShowEditing] = useState(false);
  /** Question the student is hovering in the rail — drives the highlighter. */
  const [previewHighlight, setPreviewHighlight] = useState<string | null>(null);

  const step = run[index];
  const total = run.length;
  const answerList = useMemo(() => Object.values(answers), [answers]);
  const correctCount = answerList.filter((a) => a.correct).length;
  const isLast = index >= total - 1;

  const selected = step ? (picked[step.question.id] ?? null) : null;
  const revealed = step ? Boolean(revealedIds[step.question.id]) : false;

  const activeHighlight = previewHighlight ?? step?.question.highlightPhrase;

  const check = useCallback(() => {
    if (selected === null || revealed || !step) return;
    const questionId = step.question.id;
    const correct = selected === step.question.correctIndex;
    setRevealedIds((prev) => ({ ...prev, [questionId]: true }));
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        category: step.question.category,
        correct,
      },
    }));
    setStreak((value) => {
      const next = correct ? value + 1 : 0;
      setBestStreak((best) => Math.max(best, next));
      return next;
    });
    // Only the first reveal of a question counts toward the radar.
    recordCategoryAttempt(step.question.category, correct);
  }, [selected, revealed, step]);

  const goPrev = useCallback(() => {
    if (index <= 0) return;
    setIndex((current) => current - 1);
    setPreviewHighlight(null);
  }, [index]);

  const advance = useCallback(() => {
    if (!revealed) return;
    if (isLast) {
      recordQuizResult(correctCount, total, subjectTitle);
      recordQuestProgress("solve-test", 1);
      recordDailyActivity();
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setPreviewHighlight(null);
  }, [revealed, isLast, correctCount, total, subjectTitle]);

  const restart = useCallback(() => {
    setIndex(0);
    setPicked({});
    setRevealedIds({});
    setAnswers({});
    setFinished(false);
    setPreviewHighlight(null);
    setStreak(0);
    setBestStreak(0);
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[2]" />
            არქივი
          </button>
          <span className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 ${PLAIN_CARD}`}>
            {year} · {variant.label}
          </span>
        </div>

        {variant.editingTask && (
          <button
            type="button"
            onClick={() => setShowEditing(true)}
            className={`group flex w-full items-center justify-between gap-4 rounded-2xl border-2 p-5 text-left transition-transform duration-300 hover:-translate-y-1 ${ACCENT_CARD.amber}`}
          >
            <div className="min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${ACCENT_PILL.amber}`}
              >
                <PenLine className="h-3 w-3 stroke-[2.5]" />
                I ნაწილი · {variant.editingTask.points} ქულა
              </span>
              <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-50">
                ტექსტის რედაქტირება
              </h3>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                გაასწორე შეცდომები და გადაწერე ტექსტი შინაარსის შეცვლის გარეშე.
              </p>
            </div>
            <ArrowRight
              className={`h-4 w-4 shrink-0 stroke-[2.5] transition group-hover:translate-x-0.5 ${ACCENT_TEXT.amber}`}
            />
          </button>
        )}

        <section
          aria-label="ტექსტის არჩევა"
          className={`${PANEL} p-6`}
        >
          <span className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${ACCENT_PILL[accent]}`}>
            <BookOpen className="h-3 w-3 stroke-[2]" />
            II ნაწილი · წაკითხულის გააზრება
          </span>
          <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-50">
            აირჩიე ერთ-ერთი ტექსტი
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
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
                  setPicked({});
                  setRevealedIds({});
                  setAnswers({});
                }}
                className={`group rounded-2xl border-2 p-5 text-left transition-transform duration-300 hover:-translate-y-1 ${PLAIN_CARD}`}
              >
                <span
                  className={`inline-flex rounded-full border-2 px-3 py-1 text-[11px] font-bold ${ACCENT_PILL[accent]}`}
                >
                  {passage.choiceLabel ?? `ტექსტი ${passageIndex + 1}`}
                </span>
                <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
                  {passage.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{passage.authorOrSource}</p>
                <p className="mt-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {passage.questions.length} კითხვა
                  {passage.essay ? ` · ესე ${passage.essay.points} ქულა` : ""}
                </p>
                <span className={`mt-3 inline-flex items-center gap-1.5 text-xs font-bold ${ACCENT_TEXT[accent]}`}>
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
    const byCategory = answerList.reduce<Record<string, { correct: number; total: number }>>(
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
        className={`${PANEL} p-6 sm:p-8`}
      >
        <QuestComplete
          accent={accent}
          title="ვარიანტი დასრულებულია"
          subtitle={`${subjectTitle} · ${year} · ${variant.label}`}
          score={correctCount}
          total={total}
          stats={[
            { label: "საუკეთესო სერია", value: `${bestStreak} ზედიზედ` },
            { label: "პასუხები", value: `${answerList.length}/${total}` },
            { label: "სისწორე", value: `${percent}%` },
          ]}
        />

        <div className="mt-8">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            კატეგორიების ჭრილში
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(byCategory).map(([category, tally]) => {
              const meta = EXAM_CATEGORY_META[category as ExamCategory];
              const rate = Math.round((tally.correct / tally.total) * 100);
              return (
                <div
                  key={category}
                  className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 ${PLAIN_CARD}`}
                >
                  <span className="text-sm text-slate-700 dark:text-slate-200">{meta.label}</span>
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
          <div className={`mt-8 rounded-2xl border-2 p-5 ${ACCENT_CARD.violet}`}>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${ACCENT_PILL.violet}`}
            >
              <PenLine className="h-3 w-3 stroke-[2]" />
              წერითი დავალება · {chosenPassage.essay.points} ქულა
            </span>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-200">
              {chosenPassage.essay.prompt}
            </p>
            <Link
              href={`/subject/${subjectId}/essay-grader?prompt=${encodeURIComponent(
                chosenPassage.essay.prompt,
              )}`}
              className={`paper-sticker mt-4 inline-flex items-center gap-2 rounded-full border-2 px-5 py-2.5 text-sm font-bold ${ACCENT_SOLID.violet}`}
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
            className={`paper-sticker inline-flex items-center gap-2 rounded-full border-2 px-5 py-2.5 text-sm font-bold ${ACCENT_SOLID[accent]}`}
          >
            <RefreshCw className="h-4 w-4 stroke-[2]" />
            თავიდან
          </button>
          <button
            type="button"
            onClick={onExit}
            className={`inline-flex items-center gap-2 rounded-full border-2 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 ${PLAIN_CARD}`}
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[2]" />
          არქივი
        </button>
        <div className="flex items-center gap-3">
          <ComboBadge streak={streak} />
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 ${PLAIN_CARD}`}
          >
            {year} · {variant.label}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[11px] font-bold ${ACCENT_PILL.green}`}
          >
            <Target className="h-3 w-3 stroke-[2.5]" />
            {correctCount}/{answerList.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        {/* ---------------------- LEFT: reading panel ---------------------- */}
        <section
          aria-label="საკითხავი ტექსტი"
          className={`${PANEL} relative overflow-hidden p-6`}
        >
          <div className="relative z-[1]">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${ACCENT_PILL[accent]}`}>
                ეროვნული გამოცდა · {year}
              </span>
              <span
                className={`inline-flex rounded-full border-2 px-3 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 ${PLAIN_CARD}`}
              >
                {passage.authorOrSource}
              </span>
            </div>

            <h2 className="mb-5 text-xl font-bold leading-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
              {passage.title}
            </h2>

            <TropeHighlightedPassage
              text={passage.textExcerpt}
              highlight={activeHighlight}
              intensity={previewHighlight ? "strong" : "soft"}
              preserveLines={passage.kind === "poem"}
            />

            {activeHighlight && (
              <p
                className={`mt-6 flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-[11px] leading-relaxed ${ACCENT_CARD[accent]} ${ACCENT_TEXT[accent]}`}
              >
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 stroke-[2]" />
                ხაზგასმულია მონაკვეთი, რომელსაც კითხვა ეხება.
              </p>
            )}
          </div>
        </section>

        {/* ------------------- RIGHT: question wizard ---------------------- */}
        <section
          aria-label="კითხვების ვიზარდი"
          className={`${PANEL} relative overflow-hidden p-6`}
        >
          {/* Small, fast, and out of the way — the clock is what matters. */}
          <CorrectPop show={isCorrect} accent={accent} triggerKey={question.id} />

          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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

          {/* Progress: one solid bar, no gradient, with a star riding the
              front of it as the run fills up. */}
          <div className="relative mb-7 h-1.5 w-full overflow-visible rounded-full bg-slate-200 dark:bg-white/[0.08]">
            <motion.div
              className={`h-full rounded-full ${PROGRESS_FILL[accent]}`}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
            <motion.span
              className="absolute -top-1.5 -ml-2"
              animate={{ left: `${progressPercent}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              aria-hidden
            >
              <Sparkle className={`h-3.5 w-3.5 ${ACCENT_TEXT[accent]}`} />
            </motion.span>
          </div>

          <p
            className="mb-5 text-[15px] font-semibold leading-relaxed text-slate-900 dark:text-slate-50"
            onMouseEnter={() => question.highlightPhrase && setPreviewHighlight(question.highlightPhrase)}
            onMouseLeave={() => setPreviewHighlight(null)}
          >
            {question.questionText}
          </p>

          <div className="space-y-2.5">
            {question.options.map((option, optionIndex) => {
              const isChosen = selected === optionIndex;
              const isAnswer = optionIndex === question.correctIndex;

              let stateClass = `${PLAIN_CARD} text-slate-800 dark:text-slate-200`;
              if (revealed && isAnswer) {
                stateClass = "border-emerald-600 bg-emerald-600 text-white";
              } else if (revealed && isChosen) {
                stateClass = "border-pink-600 bg-pink-600 text-white";
              } else if (isChosen) {
                stateClass = ACCENT_SOLID[accent];
              }

              return (
                <button
                  key={option}
                  type="button"
                  disabled={revealed}
                  onClick={() =>
                    setPicked((prev) => ({ ...prev, [question.id]: optionIndex }))
                  }
                  className={`flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm leading-relaxed transition-all disabled:cursor-default ${stateClass}`}
                >
                  <span
                    className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 text-[11px] font-bold ${
                      (revealed && isAnswer) || (revealed && isChosen) || isChosen
                        ? "border-white/60 text-white"
                        : "border-slate-400 text-slate-500 dark:border-white/25 dark:text-white/50"
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
                    className={`mb-2 inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[11px] font-bold ${
                      isCorrect ? ACCENT_PILL.green : ACCENT_PILL.pink
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
                  <div className={`rounded-2xl border-2 p-4 ${ACCENT_CARD[accent]}`}>
                    <p
                      className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${ACCENT_TEXT[accent]}`}
                    >
                      <Lightbulb className="h-3 w-3 stroke-[2.5]" />
                      ახსნა
                    </p>
                    <p className="text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-200">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* --------------------------- action row ------------------------- */}
          <div className="mt-6 flex items-center gap-2.5">
            <button
              type="button"
              onClick={goPrev}
              disabled={index === 0}
              aria-label="წინა კითხვა"
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 ${PLAIN_CARD} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
              <span className="hidden sm:inline">წინა</span>
            </button>

            {!revealed ? (
              <button
                type="button"
                onClick={check}
                disabled={selected === null}
                className={`paper-sticker inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${ACCENT_SOLID[accent]}`}
              >
                პასუხის შემოწმება
              </button>
            ) : (
              <button
                type="button"
                onClick={advance}
                className={`paper-sticker inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-bold ${ACCENT_SOLID.green}`}
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[2]" />
          ვარიანტის დავალებები
        </button>
        <span className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[11px] font-bold ${ACCENT_PILL.amber}`}>
          {year} · {variantLabel} · {task.points} ქულა
        </span>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-6">
        <section className={`${PANEL} p-6`}>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">ტექსტის რედაქტირება</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            გაასწორე მორფოლოგიურ-ორთოგრაფიული, სინტაქსური და პუნქტუაციური
            შეცდომები და სტილისტიკური ხარვეზები. შინაარსი არ შეცვალო.
          </p>
          <div className="exam-paper mt-4 p-4">
            <p className="whitespace-pre-line text-[14.5px] leading-[1.95] text-slate-800 dark:text-slate-200">
              {task.text}
            </p>
          </div>
        </section>

        <section className={`${PANEL} p-6`}>
          <label className="block">
            <span className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>შენი გასწორებული ვერსია</span>
              <span className="text-slate-500 dark:text-slate-400">{words} სიტყვა</span>
            </span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="გადაწერე მთელი ტექსტი გასწორებული სახით..."
              className="min-h-[360px] w-full resize-y rounded-2xl border-2 border-slate-300/80 bg-white/60 p-4 text-[14.5px] leading-[1.9] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500/70 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowKey((value) => !value)}
            className={`paper-sticker mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-bold ${ACCENT_SOLID.amber}`}
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
