"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CircleCheck,
  Clock,
  Lightbulb,
  LoaderCircle,
  Pause,
  PenLine,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import {
  type ExamPassage,
  type ExamVariant,
} from "@/data/pastExamsData";
import { ESSAY_TOTAL_MAX } from "@/lib/ai/essay-grader-schema";
import { EXAM_CATEGORY_META, type ExamCategory } from "@/lib/exam-categories";
import { recordCategoryAttempt } from "@/lib/category-accuracy";
import { recordQuestProgress } from "@/lib/daily-quests";
import { recordQuizResult } from "@/lib/dashboard-metrics";
import { recordDailyActivity } from "@/lib/daily-streak";
import { EssayReport } from "./EssayReport";
import { TropeHighlightedPassage } from "./TropeHighlightedPassage";
import { useEssayGrading } from "./useEssayGrading";

/** The real paper allows three hours. */
const EXAM_SECONDS = 3 * 60 * 60;
const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

type Stage = "editing" | "choose" | "questions" | "essay" | "done";

const STAGE_ORDER: Stage[] = ["editing", "choose", "questions", "essay"];

/** Full name — used as the step's tooltip. */
const STAGE_LABEL: Record<Stage, string> = {
  editing: "I ნაწილი · ტექსტის რედაქტირება",
  choose: "II ნაწილი · ტექსტის არჩევა",
  questions: "II ნაწილი · კითხვები",
  essay: "წერითი დავალება",
  done: "დასრულებული",
};

/** What the minimal rail actually prints. */
const STAGE_SHORT: Record<Stage, string> = {
  editing: "რედაქტირება",
  choose: "ტექსტის არჩევა",
  questions: "კითხვები",
  essay: "წერითი დავალება",
  done: "დასრულებული",
};

interface AnswerRecord {
  questionId: string;
  category: ExamCategory;
  correct: boolean;
}

interface ExamSimulationProps {
  subjectTitle: string;
  year: number;
  variant: ExamVariant;
  onExit: () => void;
}

/* -------------------------------------------------------------------------- */
/*                              SHARED SURFACES                               */
/* -------------------------------------------------------------------------- */

const PANEL =
  "rounded-[30px] border border-slate-200/90 bg-white/85 shadow-[0_10px_40px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/[0.09] dark:bg-[#101016]/75 dark:shadow-none";
const TITLE = "text-slate-900 dark:text-white";
const MUTED = "text-slate-500 dark:text-zinc-400";
const FAINT = "text-slate-400 dark:text-zinc-500";

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------- */
/*                                   TIMER                                    */
/* -------------------------------------------------------------------------- */

function ExamTimer({
  remaining,
  running,
  onToggle,
}: {
  remaining: number;
  running: boolean;
  onToggle: () => void;
}) {
  const low = remaining <= 15 * 60;
  const critical = remaining <= 5 * 60;

  return (
    <button
      type="button"
      onClick={onToggle}
      title={running ? "პაუზა" : "გაგრძელება"}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-bold tabular-nums transition ${
        critical
          ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-400/35 dark:bg-rose-500/10 dark:text-rose-300"
          : low
            ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-400/35 dark:bg-amber-500/10 dark:text-amber-300"
            : "border-slate-200 bg-white/70 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300"
      }`}
    >
      {running ? (
        <Clock className="h-3.5 w-3.5 stroke-[2]" />
      ) : (
        <Pause className="h-3.5 w-3.5 stroke-[2]" />
      )}
      {formatClock(remaining)}
      {!running && <Play className="h-3 w-3 stroke-[2.5] opacity-70" />}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                              READING PANEL                                 */
/* -------------------------------------------------------------------------- */

function ReadingPanel({
  passage,
  highlight,
  strong,
  year,
  footer,
}: {
  passage: ExamPassage;
  highlight?: string;
  strong?: boolean;
  year: number;
  footer?: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // The pane scrolls inside itself, so a highlight further down the text
  // would otherwise sit off-screen. Glide to it instead of jumping.
  useEffect(() => {
    if (!highlight) return;
    const follow = () => {
      const container = scrollRef.current;
      const mark = container?.querySelector("mark");
      if (!container || !mark) return;
      const target =
        mark.offsetTop - container.clientHeight / 2 + mark.clientHeight / 2;
      // `.exam-scroll` carries `scroll-behavior: smooth`, so this glides.
      container.scrollTop = Math.max(0, target);
    };
    const id = window.setTimeout(follow, 120);
    return () => window.clearTimeout(id);
  }, [highlight, passage.id]);

  return (
    <section
      aria-label="საკითხავი ტექსტი"
      className={`${PANEL} flex flex-col overflow-hidden p-5 sm:p-7 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)]`}
    >
      <header className="shrink-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/70 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-300">
            ეროვნული გამოცდა · {year}
          </span>
          {passage.choiceLabel && (
            <span
              className={`inline-flex rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[10px] font-semibold ${MUTED} dark:border-white/10 dark:bg-white/[0.03]`}
            >
              {passage.choiceLabel}
            </span>
          )}
        </div>
        <h2 className={`text-xl font-bold leading-tight sm:text-[22px] ${TITLE}`}>
          {passage.title}
        </h2>
        <p className={`mt-1 text-xs ${FAINT}`}>
          ავტორი / წყარო: <span className={MUTED}>{passage.authorOrSource}</span>
        </p>
      </header>

      <div ref={scrollRef} className="exam-scroll relative mt-5 min-h-0 flex-1 pr-3">
        <div className="exam-paper p-5 sm:p-6">
          <TropeHighlightedPassage
            text={passage.textExcerpt}
            highlight={highlight}
            intensity={strong ? "strong" : "soft"}
            preserveLines={passage.kind === "poem"}
            themed
          />
        </div>
        {footer}
      </div>

      {highlight && (
        <p className="mt-3 flex shrink-0 items-start gap-2 rounded-xl border border-cyan-200 bg-cyan-50/70 px-3 py-2 text-[11px] leading-relaxed text-cyan-800 dark:border-cyan-500/15 dark:bg-cyan-500/[0.05] dark:text-cyan-200/80">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 stroke-[1.75]" />
          ხაზგასმულია მონაკვეთი, რომელსაც კითხვა ეხება.
        </p>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                             MAIN COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function ExamSimulation({
  subjectTitle,
  year,
  variant,
  onExit,
}: ExamSimulationProps) {
  const [stage, setStage] = useState<Stage>(
    variant.editingTask ? "editing" : "choose",
  );
  const [chosenId, setChosenId] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  /* Per-question state, so stepping back restores exactly what was there. */
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [previewHighlight, setPreviewHighlight] = useState<string | null>(null);

  const [remaining, setRemaining] = useState(EXAM_SECONDS);
  const [running, setRunning] = useState(true);
  const scoredRef = useRef(false);

  const [essayDraft, setEssayDraft] = useState("");
  const essayGrading = useEssayGrading("abit-exam-essay");
  const essayWords = useMemo(
    () => essayDraft.trim().split(/\s+/).filter(Boolean).length,
    [essayDraft],
  );

  const passage = useMemo(
    () => variant.passages.find((p) => p.id === chosenId) ?? null,
    [variant.passages, chosenId],
  );
  const questions = passage?.questions ?? [];
  const question = questions[index];
  const total = questions.length;
  const answerList = useMemo(() => Object.values(answers), [answers]);
  const correctCount = answerList.filter((a) => a.correct).length;

  const selected = question ? (picked[question.id] ?? null) : null;
  const revealed = question ? Boolean(revealedIds[question.id]) : false;

  /* --------------------------------- timer -------------------------------- */
  useEffect(() => {
    if (!running || stage === "done") return;
    const id = window.setInterval(() => {
      setRemaining((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, stage]);

  useEffect(() => {
    if (remaining !== 0) return;
    const stop = () => setRunning(false);
    stop();
  }, [remaining]);

  /* -------------------------------- actions ------------------------------- */
  const check = useCallback(() => {
    if (selected === null || revealed || !question) return;
    const correct = selected === question.correctIndex;
    setRevealedIds((prev) => ({ ...prev, [question.id]: true }));
    setAnswers((prev) => ({
      ...prev,
      [question.id]: {
        questionId: question.id,
        category: question.category,
        correct,
      },
    }));
    // Only the first reveal of a question counts toward the radar.
    recordCategoryAttempt(question.category, correct);
  }, [selected, revealed, question]);

  const goPrev = useCallback(() => {
    if (index <= 0) return;
    setIndex((v) => v - 1);
    setPreviewHighlight(null);
  }, [index]);

  const advance = useCallback(() => {
    if (!revealed) return;
    if (index >= total - 1) {
      setStage(passage?.essay ? "essay" : "done");
      return;
    }
    setIndex((v) => v + 1);
    setPreviewHighlight(null);
  }, [revealed, index, total, passage?.essay]);

  const finish = useCallback(() => {
    if (!scoredRef.current) {
      scoredRef.current = true;
      recordQuizResult(correctCount, total || 1, subjectTitle);
      recordQuestProgress("solve-test", 1);
      recordDailyActivity();
    }
    setRunning(false);
    setStage("done");
  }, [correctCount, total, subjectTitle]);

  const restart = useCallback(() => {
    setStage(variant.editingTask ? "editing" : "choose");
    setChosenId(null);
    setIndex(0);
    setPicked({});
    setRevealedIds({});
    setAnswers({});
    setPreviewHighlight(null);
    setRemaining(EXAM_SECONDS);
    setRunning(true);
    scoredRef.current = false;
    setEssayDraft("");
    essayGrading.reset();
  }, [variant.editingTask, essayGrading]);

  const stageIndex = STAGE_ORDER.indexOf(stage === "done" ? "essay" : stage);

  /**
   * A step is reachable once the work it depends on exists: the editing
   * task and the text choice are always open, questions need a chosen
   * text, and the essay needs that text to actually carry one.
   */
  const stageReachable = useCallback(
    (target: Stage) => {
      if (target === "editing") return Boolean(variant.editingTask);
      if (target === "choose") return true;
      if (target === "questions") return Boolean(passage);
      if (target === "essay") return Boolean(passage?.essay);
      return false;
    },
    [variant.editingTask, passage],
  );

  const goToStage = useCallback(
    (target: Stage) => {
      if (!stageReachable(target) || target === stage) return;
      setPreviewHighlight(null);
      setStage(target);
    },
    [stageReachable, stage],
  );

  /* ------------------------------- chrome --------------------------------- */
  const header = (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={onExit}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold transition ${MUTED} hover:text-slate-900 dark:hover:text-white`}
      >
        <ArrowLeft className="h-3.5 w-3.5 stroke-[2]" />
        არქივი
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-bold ${MUTED} dark:border-white/10 dark:bg-white/[0.04]`}
        >
          {year} · {variant.label}
        </span>
        <ExamTimer
          remaining={remaining}
          running={running}
          onToggle={() => setRunning((v) => !v)}
        />
      </div>
    </div>
  );

  const stageRail = (
    <nav aria-label="გამოცდის ეტაპები" className="mb-7">
      <ol className="flex items-center gap-1 overflow-x-auto pb-1">
        {STAGE_ORDER.map((s, i) => {
          const active = i === stageIndex && stage !== "done";
          const passed = i < stageIndex || stage === "done";
          const reachable = stageReachable(s);
          const last = i === STAGE_ORDER.length - 1;

          return (
            <li key={s} className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => goToStage(s)}
                disabled={!reachable}
                title={STAGE_LABEL[s]}
                aria-current={active ? "step" : undefined}
                className={`group inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition disabled:cursor-not-allowed ${
                  reachable && !active
                    ? "hover:bg-slate-100/80 dark:hover:bg-white/[0.04]"
                    : ""
                }`}
              >
                <span
                  className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition ${
                    passed
                      ? "border-transparent bg-cyan-500 text-white"
                      : active
                        ? "border-cyan-500 bg-transparent text-cyan-600 ring-4 ring-cyan-500/15 dark:border-cyan-400 dark:text-cyan-300 dark:ring-cyan-400/15"
                        : "border-slate-300 text-slate-400 dark:border-white/15 dark:text-zinc-600"
                  }`}
                >
                  {passed ? <Check className="h-3 w-3 stroke-[3]" /> : i + 1}
                </span>
                <span
                  className={`whitespace-nowrap text-[12px] transition ${
                    active
                      ? "font-bold text-slate-900 dark:text-white"
                      : passed
                        ? "font-semibold text-slate-600 dark:text-zinc-300"
                        : "font-medium text-slate-400 dark:text-zinc-600"
                  }`}
                >
                  {STAGE_SHORT[s]}
                </span>
              </button>

              {!last && (
                <span
                  aria-hidden
                  className={`mx-1 h-px w-6 shrink-0 transition-colors sm:w-9 ${
                    i < stageIndex || stage === "done"
                      ? "bg-cyan-400"
                      : "bg-slate-200 dark:bg-white/10"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );

  /* ============================ STAGE: editing ============================ */
  if (stage === "editing" && variant.editingTask) {
    return (
      <div>
        {header}
        {stageRail}
        <EditingStage
          task={variant.editingTask}
          onDone={() => setStage("choose")}
        />
      </div>
    );
  }

  /* ============================ STAGE: choose ============================= */
  if (stage === "choose") {
    return (
      <div>
        {header}
        {stageRail}

        <section className={`${PANEL} p-5 sm:p-7`}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/70 bg-cyan-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:border-cyan-400/25 dark:bg-cyan-500/10 dark:text-cyan-300">
            <BookOpen className="h-3 w-3 stroke-[2]" />
            II ნაწილი · წაკითხულის გააზრება
          </span>
          <h2 className={`mt-3 text-xl font-bold ${TITLE}`}>
            აირჩიე ერთ-ერთი ტექსტი
          </h2>
          <p className={`mt-1 text-sm ${MUTED}`}>
            კითხვებსაც და წერით დავალებასაც მხოლოდ არჩეული ტექსტის მიხედვით
            შეასრულებ — ისე, როგორც რეალურ გამოცდაზე.
          </p>

          <div className="mt-6 space-y-4">
            {variant.passages.map((p, i) => (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.3 }}
                className="rounded-[26px] border border-slate-200 bg-white/70 p-5 dark:border-white/[0.08] dark:bg-white/[0.02]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-flex rounded-full border border-cyan-300/70 bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/[0.08] dark:text-cyan-300">
                        {p.choiceLabel ?? `ტექსტი ${i + 1}`}
                      </span>
                      {p.id === chosenId && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                          <Check className="h-3 w-3 stroke-[3]" />
                          არჩეული
                        </span>
                      )}
                    </span>
                    <h3 className={`mt-2.5 text-lg font-bold ${TITLE}`}>{p.title}</h3>
                    <p className={`mt-0.5 text-xs ${FAINT}`}>{p.authorOrSource}</p>
                  </div>
                  <span className={`shrink-0 text-[11px] font-semibold ${FAINT}`}>
                    {p.questions.length} კითხვა
                    {p.essay ? ` · ესე ${p.essay.points} ქულა` : ""}
                  </span>
                </div>

                <div className="exam-paper mt-4 max-h-40 overflow-hidden p-4">
                  <p
                    className={`exam-prose line-clamp-4 ${
                      p.kind === "poem" ? "exam-prose-poem" : ""
                    }`}
                  >
                    {p.textExcerpt.slice(0, 260)}…
                  </p>
                </div>

                {p.essay && (
                  <p
                    className={`mt-3 rounded-xl border border-violet-200 bg-violet-50/70 px-3 py-2 text-[12px] leading-relaxed text-violet-800 dark:border-violet-400/20 dark:bg-violet-500/[0.06] dark:text-violet-200/85`}
                  >
                    <span className="font-bold">წერითი დავალება: </span>
                    {p.essay.prompt}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    // Coming back and re-picking the same text keeps the
                    // answers; switching texts starts that part over.
                    if (p.id !== chosenId) {
                      setChosenId(p.id);
                      setIndex(0);
                      setPicked({});
                      setRevealedIds({});
                      setAnswers({});
                    }
                    setStage("questions");
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 transition-all hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98]"
                >
                  {p.id === chosenId ? "გაგრძელება" : "ამ ტექსტით გაგრძელება"}
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </button>
              </motion.article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  /* =========================== STAGE: questions =========================== */
  if (stage === "questions" && passage && question) {
    const activeHighlight = previewHighlight ?? question.highlightPhrase;
    const meta = EXAM_CATEGORY_META[question.category];
    const isCorrect = revealed && selected === question.correctIndex;

    return (
      <div>
        {header}
        {stageRail}

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:gap-6">
          <ReadingPanel
            passage={passage}
            highlight={activeHighlight}
            strong={Boolean(previewHighlight)}
            year={year}
          />

          <section aria-label="კითხვები" className={`${PANEL} p-5 sm:p-7`}>
            <div className="relative mb-7 inline-flex flex-col items-start">
              <span
                className={`-rotate-2 rounded-full border-2 border-slate-200 bg-white/80 px-5 py-2 text-[11px] font-bold uppercase tracking-wider ${MUTED} dark:border-white/20 dark:bg-white/[0.03] dark:text-white/80`}
              >
                კითხვა {index + 1} / {total}
              </span>
              <span
                className={`-mt-2 ml-8 inline-flex rotate-1 items-center gap-1.5 rounded-full border-2 px-5 py-2 text-[11px] font-bold ${meta.badgeClassLight} ${meta.badgeClass}`}
              >
                {meta.label}
              </span>
            </div>

            {/* One pill per question — click to jump to any you've reached. */}
            <div className="mb-6 flex items-center gap-1.5">
              {questions.map((q, i) => {
                const done = Boolean(revealedIds[q.id]);
                const reachable = done || i <= index;
                return (
                  <button
                    key={q.id}
                    type="button"
                    disabled={!reachable}
                    onClick={() => {
                      setIndex(i);
                      setPreviewHighlight(null);
                    }}
                    aria-label={`კითხვა ${i + 1}`}
                    aria-current={i === index ? "step" : undefined}
                    className={`h-1.5 flex-1 overflow-hidden rounded-full transition-colors duration-300 disabled:cursor-not-allowed ${
                      done
                        ? "bg-cyan-400"
                        : i === index
                          ? "bg-slate-200 dark:bg-white/10"
                          : "bg-slate-100 dark:bg-white/[0.06]"
                    } ${i === index ? "ring-2 ring-cyan-400/40 ring-offset-2 ring-offset-white dark:ring-offset-[#101016]" : ""}`}
                  >
                    {i === index && !done && (
                      <motion.span
                        key={`fill-${index}`}
                        initial={{ width: "0%" }}
                        animate={{ width: "45%" }}
                        transition={{ duration: 1.1, ease: "easeOut" }}
                        className="block h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Keyed on the question so React remounts and replays the
                enter animation. Deliberately not wrapped in AnimatePresence:
                a "wait" exit can strand the panel empty between questions. */}
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
                <div
                  className="mb-6 rounded-[26px] border-2 border-slate-200 bg-white/60 p-5 dark:border-white/15 dark:bg-white/[0.02]"
                  onMouseEnter={() =>
                    question.highlightPhrase &&
                    setPreviewHighlight(question.highlightPhrase)
                  }
                  onMouseLeave={() => setPreviewHighlight(null)}
                >
                  <h3
                    className={`text-[16.5px] font-semibold leading-relaxed ${TITLE}`}
                  >
                    {question.questionText}
                  </h3>
                </div>

                <div className="space-y-3">
                  {question.options.map((option, i) => {
                    const isSelected = selected === i;
                    const isAnswer = i === question.correctIndex;

                    let pill =
                      "border-slate-200 bg-white/50 text-slate-700 hover:border-cyan-400/60 hover:bg-cyan-50/60 dark:border-white/15 dark:bg-transparent dark:text-zinc-200 dark:hover:border-cyan-400/50 dark:hover:bg-cyan-500/[0.03]";
                    let circle =
                      "border-slate-300 text-slate-400 dark:border-white/20 dark:text-white/40";
                    if (revealed && isAnswer) {
                      pill =
                        "border-transparent bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20";
                      circle = "border-white/50 text-white";
                    } else if (revealed && isSelected) {
                      pill =
                        "border-transparent bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20";
                      circle = "border-white/50 text-white";
                    } else if (revealed) {
                      pill =
                        "border-slate-200 bg-transparent text-slate-400 dark:border-white/10 dark:text-white/25";
                    } else if (isSelected) {
                      pill =
                        "border-transparent bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20";
                      circle = "border-white/50 text-white";
                    }

                    return (
                      <motion.button
                        key={`${question.id}-${i}`}
                        type="button"
                        disabled={revealed}
                        onClick={() =>
                          setPicked((prev) => ({ ...prev, [question.id]: i }))
                        }
                        whileTap={revealed ? undefined : { scale: 0.985 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.35,
                          ease: "easeOut",
                          delay: revealed ? 0 : i * 0.05,
                        }}
                        className={`flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-[14.5px] leading-relaxed transition-all disabled:cursor-default ${pill}`}
                      >
                        <span
                          className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 text-[11px] font-bold ${circle}`}
                        >
                          {revealed && isAnswer ? (
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          ) : revealed && isSelected ? (
                            <X className="h-3.5 w-3.5 stroke-[3]" />
                          ) : (
                            OPTION_LETTERS[i]
                          )}
                        </span>
                        <span className="min-w-0 flex-1">{option}</span>
                      </motion.button>
                    );
                  })}
                </div>
            </motion.div>

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
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <Check className="h-3 w-3 stroke-[2.5]" /> სწორია
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3 stroke-[2.5]" /> არასწორია
                        </>
                      )}
                    </p>
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4 dark:border-cyan-500/25 dark:bg-cyan-950/30">
                      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                        <Lightbulb className="h-3 w-3 stroke-[2]" />
                        ახსნა
                      </p>
                      <p className="text-[13.5px] leading-relaxed text-cyan-900/85 dark:text-cyan-50/85">
                        {question.explanation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                onClick={goPrev}
                disabled={index === 0}
                aria-label="წინა კითხვა"
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold transition ${MUTED} hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/12 dark:hover:border-white/25 dark:hover:text-white`}
              >
                <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
                <span className="hidden sm:inline">წინა</span>
              </button>

              {!revealed ? (
                <button
                  type="button"
                  onClick={check}
                  disabled={selected === null}
                  className="flex-1 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 transition-all hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  პასუხის შემოწმება
                </button>
              ) : (
                <button
                  type="button"
                  onClick={advance}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 transition-all hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98]"
                >
                  {index >= total - 1 ? "წერით დავალებაზე გადასვლა" : "შემდეგი კითხვა"}
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  /* ============================= STAGE: essay ============================= */
  if (stage === "essay" && passage?.essay) {
    return (
      <div>
        {header}
        {stageRail}

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:gap-6">
          <ReadingPanel passage={passage} year={year} />

          <section className={`${PANEL} p-5 sm:p-7`}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/70 bg-violet-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:border-violet-400/25 dark:bg-violet-500/10 dark:text-violet-300">
              <PenLine className="h-3 w-3 stroke-[2]" />
              წერითი დავალება · {passage.essay.points} ქულა
            </span>
            <h2 className={`mt-3 text-lg font-bold leading-relaxed ${TITLE}`}>
              {passage.essay.prompt}
            </h2>

            <ul className={`mt-4 space-y-1.5 text-[12.5px] leading-relaxed ${MUTED}`}>
              {[
                "მსჯელობა აბზაცებად დაანაწევრე და არგუმენტები მაგალითებით გაამყარე.",
                "150 სიტყვაზე ნაკლები ნაშრომი ენობრივად არ ფასდება.",
                "ოთხ-ხუთ წინადადებამდე შემოფარგლული ნაშრომი საერთოდ არ სწორდება.",
              ].map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                  {tip}
                </li>
              ))}
            </ul>

            {/* The essay is written here, inside the exam — no detour to a
                separate grader page. */}
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${FAINT}`}
                >
                  შენი ნაშრომი
                </span>
                <span
                  className={`text-[11px] font-semibold ${
                    essayWords >= 250
                      ? "text-emerald-600 dark:text-emerald-400"
                      : FAINT
                  }`}
                >
                  {essayWords} სიტყვა
                </span>
              </div>

              <textarea
                value={essayDraft}
                onChange={(event) => setEssayDraft(event.target.value)}
                placeholder="დაიწყე წერა აქ... საგამოცდო ესესთვის სასურველია 250-400 სიტყვა: შესავალი თეზისით, არგუმენტები, დასკვნა."
                className="exam-prose min-h-[340px] w-full resize-y rounded-2xl border-2 border-slate-200 bg-white/70 p-4 outline-none transition placeholder:text-slate-400 focus:border-violet-400/70 dark:border-white/10 dark:bg-black/25 dark:placeholder:text-zinc-600"
              />

              <button
                type="button"
                onClick={() => void essayGrading.grade(essayDraft, passage.essay?.prompt)}
                disabled={essayGrading.busy || essayWords === 0}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/10 transition-all hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {essayGrading.busy ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    მიმდინარეობს შეფასება...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 stroke-[2]" />
                    {essayGrading.result ? "ხელახლა შეაფასე" : "შეაფასე ნაშრომი"}
                  </>
                )}
              </button>

              {essayGrading.result && (
                <div className="mt-5">
                  <EssayReport
                    result={essayGrading.result}
                    usedFallback={essayGrading.usedFallback}
                    compact
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={finish}
              className={`mt-4 w-full rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold transition ${MUTED} hover:border-slate-300 hover:text-slate-900 dark:border-white/12 dark:hover:border-white/25 dark:hover:text-white`}
            >
              გამოცდის დასრულება და შედეგები
            </button>
          </section>
        </div>
      </div>
    );
  }

  /* ============================== STAGE: done ============================= */
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const byCategory = answerList.reduce<Record<string, { correct: number; total: number }>>(
    (acc, a) => {
      const bucket = acc[a.category] ?? { correct: 0, total: 0 };
      acc[a.category] = {
        correct: bucket.correct + (a.correct ? 1 : 0),
        total: bucket.total + 1,
      };
      return acc;
    },
    {},
  );

  return (
    <div>
      {header}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${PANEL} p-6 sm:p-8`}
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan-400/50 bg-cyan-50 dark:bg-cyan-500/10">
            <CircleCheck className="h-8 w-8 text-cyan-500 dark:text-cyan-300" strokeWidth={1.75} />
          </div>
          <h2 className={`mt-4 text-2xl font-bold ${TITLE}`}>გამოცდა დასრულებულია</h2>
          <p className={`mt-1 text-sm ${MUTED}`}>
            {subjectTitle} · {year} · {variant.label}
          </p>
          <p className={`mt-6 text-5xl font-black ${TITLE}`}>
            {correctCount}
            <span className={`text-2xl font-bold ${FAINT}`}>/{total}</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-cyan-600 dark:text-cyan-300">
            კითხვები · {percent}% სისწორე · დარჩა {formatClock(remaining)}
          </p>

          {essayGrading.result && passage?.essay && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-violet-300 bg-violet-50 px-4 py-1.5 text-sm font-bold text-violet-700 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200">
              <PenLine className="h-3.5 w-3.5 stroke-[2]" />
              წერითი დავალება: {essayGrading.result.totalScore}/
              {ESSAY_TOTAL_MAX}
            </p>
          )}
        </div>

        {essayGrading.result && (
          <div className="mt-8">
            <p
              className={`mb-3 text-[11px] font-bold uppercase tracking-wider ${FAINT}`}
            >
              ესეს შეფასება
            </p>
            <EssayReport
              result={essayGrading.result}
              usedFallback={essayGrading.usedFallback}
              compact
            />
          </div>
        )}

        {Object.keys(byCategory).length > 0 && (
          <div className="mt-8">
            <p className={`mb-3 text-[11px] font-bold uppercase tracking-wider ${FAINT}`}>
              კატეგორიების ჭრილში
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(byCategory).map(([category, tally]) => {
                const meta = EXAM_CATEGORY_META[category as ExamCategory];
                const rate = Math.round((tally.correct / tally.total) * 100);
                return (
                  <div
                    key={category}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/60 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]"
                  >
                    <span className={`text-sm ${MUTED}`}>{meta.label}</span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: rate >= 70 ? "#10b981" : meta.accent }}
                    >
                      {tally.correct}/{tally.total}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-cyan-500 hover:to-blue-500"
          >
            <RefreshCw className="h-4 w-4 stroke-[2]" />
            თავიდან
          </button>
          <button
            type="button"
            onClick={onExit}
            className={`inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold transition ${MUTED} hover:border-slate-300 hover:text-slate-900 dark:border-white/15 dark:hover:border-white/30 dark:hover:text-white`}
          >
            <ArrowLeft className="h-4 w-4 stroke-[1.75]" />
            არქივში დაბრუნება
          </button>
        </div>
      </motion.section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                      STAGE I — ტექსტის რედაქტირება                         */
/* -------------------------------------------------------------------------- */

function EditingStage({
  task,
  onDone,
}: {
  task: NonNullable<ExamVariant["editingTask"]>;
  onDone: () => void;
}) {
  // The source text is loaded straight into the editor so the student
  // corrects it in place instead of retyping the whole thing by hand.
  const [draft, setDraft] = useState(task.text);
  const [showKey, setShowKey] = useState(false);
  const words = draft.trim().split(/\s+/).filter(Boolean).length;
  const untouched = draft === task.text;

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:gap-6">
      <section
        className={`${PANEL} flex flex-col overflow-hidden p-5 sm:p-7 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)]`}
      >
        <header className="shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-300">
            <PenLine className="h-3 w-3 stroke-[2]" />
            I ნაწილი · {task.points} ქულა
          </span>
          <h2 className={`mt-3 text-xl font-bold ${TITLE}`}>ტექსტის რედაქტირება</h2>
          <p className={`mt-1 text-xs leading-relaxed ${MUTED}`}>
            გაასწორე მორფოლოგიურ-ორთოგრაფიული, სინტაქსური და პუნქტუაციური
            შეცდომები და სტილისტიკური ხარვეზები — შინაარსი არ შეცვალო.
          </p>
        </header>

        <div className="exam-scroll mt-5 min-h-0 flex-1 pr-3">
          <div className="exam-paper p-5 sm:p-6">
            <p className="exam-prose exam-prose-poem">{task.text}</p>
          </div>
        </div>
      </section>

      <section className={`${PANEL} p-5 sm:p-7`}>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${FAINT}`}>
            შენი გასწორებული ვერსია
          </span>
          <span className={`text-[11px] font-semibold ${FAINT}`}>{words} სიტყვა</span>
        </div>

        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          spellCheck={false}
          className="exam-prose min-h-[420px] w-full resize-y rounded-2xl border-2 border-slate-200 bg-white/70 p-4 outline-none transition focus:border-amber-400/70 dark:border-white/10 dark:bg-black/25"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDraft(task.text)}
            disabled={untouched}
            className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-xs font-semibold transition ${MUTED} hover:border-slate-300 hover:text-slate-900 disabled:opacity-40 dark:border-white/12 dark:hover:border-white/25 dark:hover:text-white`}
          >
            <RotateCcw className="h-3.5 w-3.5 stroke-[2]" />
            ორიგინალის დაბრუნება
          </button>
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200"
          >
            <Lightbulb className="h-3.5 w-3.5 stroke-[2]" />
            {showKey ? "დამალე პუნქტები" : "შემოწმების პუნქტები"}
          </button>
        </div>

        <AnimatePresence>
          {showKey && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-500/25 dark:bg-amber-950/25">
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  რას ამოწმებს გამსწორებელი
                </p>
                <ul className="space-y-2">
                  {task.focusPoints.map((point) => (
                    <li
                      key={point}
                      className="flex gap-2 text-[13px] leading-relaxed text-amber-900/90 dark:text-amber-50/85"
                    >
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={onDone}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 transition-all hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98]"
        >
          II ნაწილზე გადასვლა
          <ArrowRight className="h-4 w-4 stroke-[2.5]" />
        </button>
      </section>
    </div>
  );
}
